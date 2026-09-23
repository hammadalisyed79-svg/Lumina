import { redirect } from "next/navigation";

type Props = { params: Promise<{ slug: string }> };

/** Legacy mega-menu URLs → collection routes */
export default async function MoodRedirect({ params }: Props) {
  const { slug } = await params;
  redirect(`/shop/${slug}`);
}
