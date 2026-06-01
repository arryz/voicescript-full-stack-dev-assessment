import { PrismaClient } from '@prisma/client';
import { Editor } from '../types/shared';

const prisma = new PrismaClient();

export async function listEditors(prismaClient: PrismaClient = prisma): Promise<Editor[]> {
  return prismaClient.editor.findMany({ orderBy: { name: 'asc' } });
}

export async function getEditorById(
  prismaClient: PrismaClient = prisma,
  id: number
): Promise<Editor | undefined> {
  const row = await prismaClient.editor.findUnique({ where: { id } });
  return row ?? undefined;
}
