import React from "react";

export function GithubForkRibbon() {
  return (
    <div
      className="github-fork-ribbon-wrapper right"
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
        className="github-fork-ribbon"
        style={{
          position: "absolute",
          padding: "2px 0",
          backgroundColor: "#000",
          backgroundImage:
            "linear-gradient(rgba(0, 0, 0, 0), rgba(0, 0, 0, 0.15))",
          boxShadow: "rgba(0, 0, 0, 0.5) 0px 2px 3px 0px",
          font: '700 13px "Helvetica Neue", Helvetica, Arial, sans-serif',
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
            textShadow: "rgba(0, 0, 0, 0.5) 0px -1px",
            textAlign: "center",
            width: "200px",
            lineHeight: "20px",
            display: "inline-block",
            padding: "2px 0",
            borderWidth: "1px 0",
            borderStyle: "dotted",
            borderColor: "rgba(255, 255, 255, 0.7)",
          }}
        >
          Fork me on GitHub
        </a>
      </div>
    </div>
  );
}
