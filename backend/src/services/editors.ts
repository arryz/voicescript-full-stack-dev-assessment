import { PrismaClient } from '@prisma/client';
import * as editorsDA from '../data-access/editors';
import { Editor } from '../types/shared';

export async function getEditors(prisma: PrismaClient): Promise<Editor[]> {
  return editorsDA.listEditors(prisma);
}
