export const registryBase = "https://bera-ui.vercel.app/r";

export function registryItemUrl(id: string) {
  return `${registryBase}/${id}.json`;
}

export function registryInstallCommand(id: string) {
  return `npx shadcn@latest add ${registryItemUrl(id)}`;
}
