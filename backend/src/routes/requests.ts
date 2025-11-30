import { Router } from "express";
import { authMiddleware } from "../middleware/auth";
import { prisma } from "../prisma";
import { createRequestSchema, rejectSchema } from "../utils/validators";

const router = Router();

router.post("/requests", authMiddleware, async (req, res) => {
  const parsed = createRequestSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  try {
    const { title, description, managerName } = parsed.data;
    if (req.user!.role !== "EMPLOYEE") return res.status(403).json({ error: "Only employees can create requests" });
    const mgr = await prisma.user.findFirst({ where: { name: managerName, role: "MANAGER" } });
    if (!mgr) return res.status(400).json({ error: { formErrors: [], fieldErrors: { managerName: ["manager not found"] } } });
    const me = await prisma.user.findUnique({ where: { id: req.user!.id } });
    if (!me || me.managerId !== mgr.id) {
      return res.status(400).json({ error: { formErrors: [], fieldErrors: { managerName: ["manager does not match your account"] } } });
    }
    const request = await prisma.request.create({
      data: {
        title,
        description,
        createdById: req.user!.id,
        assignedToId: me.id,
        status: "PENDING_APPROVAL",
      },
    });
    return res.status(201).json(request);
  } catch {
    const msg = process.env.DATABASE_URL ? "Unexpected database error" : "Database not configured";
    return res.status(500).json({ error: msg });
  }
});

router.get("/requests", authMiddleware, async (req, res) => {
  const userId = req.user!.id;
  const role = req.user!.role;
  try {
    if (role === "MANAGER") {
      const requests = await prisma.request.findMany({
        where: { assignedTo: { managerId: userId } },
        include: { createdBy: { select: { name: true, email: true } }, assignedTo: { select: { name: true, email: true } } },
        orderBy: { createdAt: "desc" },
      });
      return res.json(requests);
    } else {
      const requests = await prisma.request.findMany({
        where: { OR: [{ createdById: userId }, { assignedToId: userId }] },
        include: { createdBy: { select: { name: true, email: true } }, assignedTo: { select: { name: true, email: true } } },
        orderBy: { createdAt: "desc" },
      });
      return res.json(requests);
    }
  } catch {
    const msg = process.env.DATABASE_URL ? "Unexpected database error" : "Database not configured";
    return res.status(500).json({ error: msg });
  }
});

router.post("/requests/:id/approve", authMiddleware, async (req, res) => {
  const id = Number(req.params.id);
  try {
    const request = await prisma.request.findUnique({
      where: { id },
      include: { assignedTo: true },
    });
    if (!request) return res.status(404).json({ error: "Request not found" });
    if (request.status !== "PENDING_APPROVAL") return res.status(400).json({ error: "Request not pending approval" });
    if (req.user!.role !== "MANAGER") return res.status(403).json({ error: "Only manager can approve" });
    if (request.assignedTo.managerId !== req.user!.id) return res.status(403).json({ error: "Not manager of assigned employee" });
    const updated = await prisma.request.update({
      where: { id },
      data: { status: "APPROVED", approvedById: req.user!.id, approvedAt: new Date(), rejectionReason: null },
    });
    return res.json(updated);
  } catch {
    const msg = process.env.DATABASE_URL ? "Unexpected database error" : "Database not configured";
    return res.status(500).json({ error: msg });
  }
});

router.post("/requests/:id/reject", authMiddleware, async (req, res) => {
  const id = Number(req.params.id);
  const parsed = rejectSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  try {
    const { reason } = parsed.data;
    const request = await prisma.request.findUnique({
      where: { id },
      include: { assignedTo: true },
    });
    if (!request) return res.status(404).json({ error: "Request not found" });
    if (request.status !== "PENDING_APPROVAL") return res.status(400).json({ error: "Request not pending approval" });
    if (req.user!.role !== "MANAGER") return res.status(403).json({ error: "Only manager can reject" });
    if (request.assignedTo.managerId !== req.user!.id) return res.status(403).json({ error: "Not manager of assigned employee" });
    const updated = await prisma.request.update({
      where: { id },
      data: { status: "REJECTED", approvedById: null, approvedAt: null, rejectedAt: new Date(), rejectionReason: reason ?? null },
    });
    return res.json(updated);
  } catch {
    const msg = process.env.DATABASE_URL ? "Unexpected database error" : "Database not configured";
    return res.status(500).json({ error: msg });
  }
});

router.post("/requests/:id/close", authMiddleware, async (req, res) => {
  const id = Number(req.params.id);
  try {
    const request = await prisma.request.findUnique({ where: { id } });
    if (!request) return res.status(404).json({ error: "Request not found" });
    if (req.user!.role !== "EMPLOYEE") return res.status(403).json({ error: "Only assigned employee can close" });
    if (request.assignedToId !== req.user!.id) return res.status(403).json({ error: "Not assigned employee" });
    if (request.status !== "APPROVED") return res.status(400).json({ error: "Request not approved" });
    const updated = await prisma.request.update({ where: { id }, data: { status: "CLOSED", closedAt: new Date() } });
    return res.json(updated);
  } catch {
    const msg = process.env.DATABASE_URL ? "Unexpected database error" : "Database not configured";
    return res.status(500).json({ error: msg });
  }
});

export default router;
