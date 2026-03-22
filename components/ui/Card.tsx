import { type ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
}

export default function Card({ children, className = "" }: CardProps) {
  return (
    <div
      className={`rounded-card bg-white shadow-card transition-shadow hover:shadow-card-hover ${className}`}
    >
      {children}
    </div>
  );
}
