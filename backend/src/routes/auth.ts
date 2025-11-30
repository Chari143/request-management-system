import { Router } from "express";
import { prisma } from "../prisma";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { config } from "../config";
import { loginSchema, signupSchema } from "../utils/validators";

const router = Router();

router.post("/signup", async (req, res) => {
  const parsed = signupSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  try {
    const { email, name, password, role, managerId, managerName } = parsed.data;
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return res.status(409).json({ error: "Email already in use" });

    if (role === "EMPLOYEE") {
      let resolvedManagerId = managerId ?? null;
      if (!resolvedManagerId && managerName) {
        const byName = await prisma.user.findFirst({ where: { name: managerName, role: "MANAGER" } });
        if (!byName) return res.status(400).json({ error: { formErrors: [], fieldErrors: { managerName: ["manager not found"] } } });
        resolvedManagerId = byName.id;
      }
      if (!resolvedManagerId) return res.status(400).json({ error: { formErrors: [], fieldErrors: { managerName: ["manager name is required"] } } });
      const manager = await prisma.user.findUnique({ where: { id: resolvedManagerId } });
      if (!manager || manager.role !== "MANAGER") return res.status(400).json({ error: { formErrors: [], fieldErrors: { managerName: ["invalid manager reference"] } } });
      const passwordHash = await bcrypt.hash(password, 10);
      const user = await prisma.user.create({
        data: { email, name, passwordHash, role, managerId: resolvedManagerId },
        select: { id: true, email: true, name: true, role: true },
      });
      return res.status(201).json(user);
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { email, name, passwordHash, role, managerId: null },
      select: { id: true, email: true, name: true, role: true },
    });
    return res.status(201).json(user);
  } catch {
    const msg = process.env.DATABASE_URL ? "Unexpected database error" : "Database not configured";
    return res.status(500).json({ error: msg });
  }
});

router.post("/login", async (req, res) => {
  const result = loginSchema.safeParse(req.body);
  if (!result.success) return res.status(400).json({ error: result.error.flatten() });
  try {
    const { email, password } = result.data;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    const token = jwt.sign({ id: user.id, role: user.role }, config.jwtSecret, { expiresIn: "7d" });
    return res.json({ token, user: { id: user.id, email: user.email, name: user.name, role: user.role } });
  } catch {
    const msg = process.env.DATABASE_URL ? "Unexpected database error" : "Database not configured";
    return res.status(500).json({ error: msg });
  }
});

export default router;
