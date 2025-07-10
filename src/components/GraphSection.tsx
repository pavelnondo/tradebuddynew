import React from "react";

interface GraphSectionProps extends React.HTMLAttributes<HTMLElement> {
  children: React.ReactNode;
  style?: React.CSSProperties;
}

export function GraphSection({ children, style, ...props }: GraphSectionProps) {
  return (
    <section
      className="graph-section"
      style={style}
      {...props}
    >
      {children}
    </section>
  );
} 