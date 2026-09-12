import type { Metadata } from "next";
import { IrisStudio } from "@/components/iris/iris-studio";
import "./iris-study.css";

export const metadata: Metadata = { title: "Iris study — Bera" };
export default function IrisStudy() {
  return <IrisStudio />;
}
