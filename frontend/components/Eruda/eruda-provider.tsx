"use client";

import eruda from "eruda";
import { ReactNode, useEffect } from "react";

export const ErudaProvider = (props: { children: ReactNode }) => {
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        eruda.init();
      } catch (error) {
        console.log("Eruda failed to initialize", error);
      }
    }
  }, []);

  return <>{props.children}</>;
};
