"use client";

import React from "react";

export function AuthShell({
  title,
  children,
  footer,
}: {
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <div
      style={{
        minHeight: "100dvh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#F9F9F7",
        fontFamily: '"Plus Jakarta Sans","Inter",sans-serif',
        padding: 16,
      }}
    >
      <div
        style={{
          width: "min(380px, 100%)",
          background: "rgba(255,255,255,0.9)",
          borderRadius: 28,
          padding: "32px 28px",
          boxShadow: "0 24px 80px rgba(0,0,0,0.06)",
          border: "1px solid rgba(0,0,0,0.05)",
          boxSizing: "border-box",
        }}
      >
        <div
          style={{
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: "0.1em",
            color: "#BDC3C7",
            marginBottom: 6,
          }}
        >
          STEPS2CONNECTION
        </div>
        <h1
          style={{
            fontSize: 22,
            fontWeight: 700,
            color: "#1a1a1a",
            margin: "0 0 24px",
            letterSpacing: "-0.02em",
          }}
        >
          {title}
        </h1>
        {children}
        {footer && (
          <div
            style={{
              marginTop: 20,
              fontSize: 13,
              color: "#9CA3AF",
              textAlign: "center",
            }}
          >
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

export function FieldLabel({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <label
      style={{
        display: "block",
        fontSize: 12,
        fontWeight: 600,
        color: "#6B7280",
        marginBottom: 8,
        ...style,
      }}
    >
      {children}
    </label>
  );
}

export const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "11px 14px",
  borderRadius: 14,
  border: "1.5px solid rgba(0,0,0,0.09)",
  background: "white",
  fontSize: 14,
  fontFamily: '"Plus Jakarta Sans","Inter",sans-serif',
  color: "#1a1a1a",
  outline: "none",
  boxSizing: "border-box",
};

export const errorStyle: React.CSSProperties = {
  marginTop: 14,
  fontSize: 13,
  color: "#EF4444",
  background: "rgba(239,68,68,0.08)",
  borderRadius: 10,
  padding: "8px 12px",
};

export const infoStyle: React.CSSProperties = {
  marginTop: 14,
  fontSize: 13,
  color: "#4C1D95",
  background: "rgba(216,180,254,0.15)",
  borderRadius: 10,
  padding: "8px 12px",
};

export const submitStyle: React.CSSProperties = {
  width: "100%",
  marginTop: 24,
  padding: "12px 20px",
  borderRadius: 16,
  border: "none",
  background: "#D8B4FE",
  fontSize: 14,
  fontWeight: 700,
  color: "#4C1D95",
  fontFamily: '"Plus Jakarta Sans","Inter",sans-serif',
  cursor: "pointer",
};

export const linkStyle: React.CSSProperties = {
  color: "#7C3AED",
  fontWeight: 600,
  textDecoration: "none",
};

export function CenteredMessage({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        height: "100dvh",
        background: "#F9F9F7",
        color: "#9CA3AF",
        fontFamily: '"Plus Jakarta Sans","Inter",sans-serif',
        fontSize: 14,
      }}
    >
      {children}
    </div>
  );
}
