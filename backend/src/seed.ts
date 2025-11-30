import "dotenv/config";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";

async function main() {
  const password = await bcrypt.hash("password", 10);

  const manager = await prisma.user.upsert({
    where: { email: "manager@example.com" },
    update: {},
    create: { email: "manager@example.com", name: "Manager One", passwordHash: password, role: "MANAGER" },
  });

  const employeeA = await prisma.user.upsert({
    where: { email: "employee.a@example.com" },
    update: {},
    create: { email: "employee.a@example.com", name: "Employee A", passwordHash: password, role: "EMPLOYEE", managerId: manager.id },
  });

  const employeeB = await prisma.user.upsert({
    where: { email: "employee.b@example.com" },
    update: {},
    create: { email: "employee.b@example.com", name: "Employee B", passwordHash: password, role: "EMPLOYEE", managerId: manager.id },
  });

  await prisma.request.create({
    data: { title: "Access Request", description: "Grant access to system", createdById: employeeA.id, assignedToId: employeeB.id },
  });
}

main().then(() => process.exit(0)).catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1); });

