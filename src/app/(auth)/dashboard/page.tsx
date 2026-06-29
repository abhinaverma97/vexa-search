import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ApiKeyManager } from "./api-key-manager";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const rawKeys = await prisma.apiKey.findMany({
    where: { userId: session.user.id },
    select: { id: true, name: true, lastUsed: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });

  const keys = rawKeys.map((k) => ({
    ...k,
    key: null,
    lastUsed: k.lastUsed?.toISOString() ?? null,
    createdAt: k.createdAt.toISOString(),
  }));

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <div className="mb-8 border-b border-[#181818] pb-5">
        <h1 className="text-xl font-bold text-white">api keys</h1>
        <p className="text-sm text-[#555] mt-1">
          Authenticate your AI agent requests via the <span className="text-[#86efac]">x-api-key</span> header.
        </p>
      </div>

      <section>
        <ApiKeyManager initialKeys={keys} />
      </section>
    </div>
  );
}
