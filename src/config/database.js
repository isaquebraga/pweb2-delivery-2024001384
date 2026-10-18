import { PrismaClient } from '@prisma/client';

// O módulo é avaliado uma única vez: todo import recebe esta mesma instância.
// Uma instância só = um pool de conexões só para a aplicação inteira.
export const prisma = new PrismaClient();
