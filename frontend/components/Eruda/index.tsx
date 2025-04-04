"use client";

import dynamic from "next/dynamic";
import { ReactNode } from "react";

const DynamicErudaProvider = dynamic(
  () => import("./eruda-provider").then((c) => c.ErudaProvider),
  {
    ssr: false,
  }
);

export const ErudaProvider = (props: { children: ReactNode }) => {
  if (process.env.NEXT_PUBLIC_APP_ENV === "production") {
    return props.children;
  }
  return <DynamicErudaProvider>{props.children}</DynamicErudaProvider>;
};
