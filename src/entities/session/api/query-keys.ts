export const sessionKeys = {
  all: ['session'] as const,
  workspace: (userId: string) => [...sessionKeys.all, 'workspace', userId] as const,
}
