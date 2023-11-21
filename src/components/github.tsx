import React from "react";

export function GithubForkRibbon() {
  return (
    <div
      className="right"
      style={{
        width: "150px",
        height: "150px",
        position: "absolute",
        overflow: "hidden",
        top: "0px",
        zIndex: 9999,
        pointerEvents: "none",
        right: "0px",
      }}
    >
      <div
        className="bg-zinc-950 text-white font-bold text-xs shadow-2xl"
        style={{
          position: "absolute",
          padding: "2px 0",
          zIndex: 9999,
          pointerEvents: "auto",
          top: "42px",
          right: "-43px",
          transform: "rotate(45deg)",
        }}
      >
        <a
          href="https://github.com/leptonai/imgpilot"
          target="_blank"
          style={{
            color: "rgb(255, 255, 255)",
            textDecoration: "none",
            textAlign: "center",
            width: "200px",
            lineHeight: "20px",
            display: "inline-block",
            padding: "2px 0",
          }}
        >
          Fork me on GitHub
        </a>
      </div>
    </div>
  );
}
