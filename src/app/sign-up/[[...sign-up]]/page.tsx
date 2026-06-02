import { SignUp } from "@clerk/nextjs";
import Link from "next/link";
import Image from "next/image";

export default function SignUpPage() {
  return (
    <div className="csn-gradient flex min-h-dvh flex-col items-center justify-center gap-6 px-5 py-12">
      <Link href="/" className="flex items-center gap-2">
        <Image src="/assets/logo-badge.png" alt="CSN" width={56} height={48} />
      </Link>
      <SignUp />
    </div>
  );
}
