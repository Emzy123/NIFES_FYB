const fs = require("fs");
const path = require("path");
const QRCode = require("qrcode");
const { createCanvas, loadImage } = require("@napi-rs/canvas");
const { buildQrPayload } = require("./ticketLogic");

const W = 1200;
const H = 660;

function roundRectPath(ctx, x, y, w, h, r) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.lineTo(x + w - rr, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + rr);
  ctx.lineTo(x + w, y + h - rr);
  ctx.quadraticCurveTo(x + w, y + h, x + w - rr, y + h);
  ctx.lineTo(x + rr, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - rr);
  ctx.lineTo(x, y + rr);
  ctx.quadraticCurveTo(x, y, x + rr, y);
  ctx.closePath();
}

function drawDiagonalPattern(ctx) {
  ctx.save();
  ctx.globalAlpha = 0.05;
  ctx.strokeStyle = "#f5b042";
  ctx.lineWidth = 1;
  const step = 24;
  for (let i = -H; i < W + H; i += step) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i + H, H);
    ctx.stroke();
  }
  ctx.restore();
}

function truncate(str, max) {
  const s = String(str || "");
  if (s.length <= max) return s;
  return `${s.slice(0, max - 1)}…`;
}

async function createTicketPng(registration, outputDir, siteConfig = {}) {
  const safeName = String(registration.ticketId || "ticket").replace(/[^\w.-]+/g, "_");
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext("2d");
  ctx.textBaseline = "middle";

  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, "#0a2f1f");
  bg.addColorStop(0.55, "#06180f");
  bg.addColorStop(1, "#000000");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  drawDiagonalPattern(ctx);

  ctx.save();
  ctx.globalAlpha = 0.07;
  ctx.font = "bold 140px 'Segoe UI', sans-serif";
  ctx.fillStyle = "#ffffff";
  ctx.translate(W * 0.5, H * 0.45);
  ctx.rotate(-0.12);
  ctx.textAlign = "center";
  ctx.fillText("NIFES", 0, 0);
  ctx.restore();

  ctx.save();
  const glow = ctx.createRadialGradient(W * 0.78, H * 0.42, 20, W * 0.78, H * 0.42, 220);
  glow.addColorStop(0, "rgba(245, 176, 66, 0.2)");
  glow.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);
  ctx.restore();

  const inset = 18;
  const borderGrad = ctx.createLinearGradient(0, 0, W, H);
  borderGrad.addColorStop(0, "#f5b042");
  borderGrad.addColorStop(0.5, "#d4af37");
  borderGrad.addColorStop(1, "#f5b042");
  ctx.strokeStyle = borderGrad;
  ctx.lineWidth = 4;
  roundRectPath(ctx, inset, inset, W - inset * 2, H - inset * 2, 20);
  ctx.stroke();
  roundRectPath(ctx, inset + 6, inset + 6, W - (inset + 6) * 2, H - (inset + 6) * 2, 16);
  ctx.strokeStyle = "rgba(253, 248, 231, 0.2)";
  ctx.lineWidth = 1;
  ctx.stroke();

  const qrPayload = buildQrPayload(registration, siteConfig);
  const qrString = JSON.stringify(qrPayload);
  const qrSize = 200;
  const qx = W - inset - 24 - qrSize;
  const qy = inset + 72;
  const padQr = 14;
  roundRectPath(ctx, qx - padQr, qy - padQr, qrSize + padQr * 2, qrSize + padQr * 2, 14);
  ctx.fillStyle = "#fffef8";
  ctx.fill();
  const goldFrame = ctx.createLinearGradient(qx - padQr, qy - padQr, qx + qrSize + padQr, qy + qrSize + padQr);
  goldFrame.addColorStop(0, "#f5b042");
  goldFrame.addColorStop(1, "#d4af37");
  ctx.strokeStyle = goldFrame;
  ctx.lineWidth = 3;
  ctx.stroke();

  const qrBuf = await QRCode.toBuffer(qrString, {
    type: "png",
    width: qrSize,
    margin: 1,
    errorCorrectionLevel: "M",
    color: { dark: "#0a2f1f", light: "#ffffff" },
  });
  const qrImg = await loadImage(qrBuf);
  ctx.drawImage(qrImg, qx, qy, qrSize, qrSize);

  const leftX = inset + 32;
  let y = inset + 52;
  ctx.textAlign = "left";

  const titleGrad = ctx.createLinearGradient(leftX, y, leftX + 420, y + 24);
  titleGrad.addColorStop(0, "#f5b042");
  titleGrad.addColorStop(1, "#d4af37");
  ctx.font = "800 22px 'Segoe UI', system-ui, sans-serif";
  ctx.fillStyle = titleGrad;
  const cardTitle = registration.ticketCardEventTitle || siteConfig.ticketCardEventTitle || "FYB DINNER & THANKSGIVING";
  ctx.fillText(truncate(cardTitle, 28), leftX, y);

  y += 44;
  ctx.font = "bold 34px 'Segoe UI', system-ui, sans-serif";
  ctx.fillStyle = "#ffffff";
  ctx.fillText(truncate(registration.fullName, 22), leftX, y);

  y += 36;
  ctx.font = "14px Consolas, monospace";
  ctx.fillStyle = "#e8c547";
  ctx.fillText(registration.ticketId || "", leftX, y);

  y += 32;
  ctx.font = "600 16px 'Segoe UI', sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.9)";
  const cat = registration.category || "Guest";
  const catLine = registration.isVipTable ? `${cat} · VIP table` : `${cat}`;
  ctx.fillText(catLine, leftX, y);

  y += 28;
  ctx.fillStyle = "rgba(253, 248, 231, 0.88)";
  ctx.font = "17px 'Segoe UI', sans-serif";
  ctx.fillText(`🪑 ${registration.assignedSeat || registration.seatLabel || ""}`, leftX, y);

  y += 26;
  ctx.font = "15px 'Segoe UI', sans-serif";
  ctx.fillStyle = "rgba(253, 248, 231, 0.75)";
  const gate = registration.entryGate || siteConfig.entryGate || "Main Gate A";
  ctx.fillText(`🚪 ${gate}`, leftX, y);

  const amount = Number(registration.amountPaid ?? registration.amount ?? 0);
  const naira = `₦${amount.toLocaleString("en-NG")}`;
  ctx.textAlign = "right";
  const payX = W - inset - 28;
  ctx.font = "600 20px 'Segoe UI', sans-serif";
  ctx.fillStyle = "#f5b042";
  ctx.fillText(naira, payX, qy + qrSize + padQr + 36);

  ctx.font = "13px Consolas, monospace";
  ctx.fillStyle = "rgba(255,255,255,0.55)";
  const pref = truncate(registration.paymentReference || registration.reference || "", 28);
  ctx.fillText(pref, payX, qy + qrSize + padQr + 62);

  const stripY = H - inset - 52;
  roundRectPath(ctx, inset + 10, stripY - 18, W - (inset + 10) * 2, 46, 12);
  ctx.fillStyle = "rgba(255,255,255,0.06)";
  ctx.fill();
  ctx.textAlign = "left";
  ctx.font = "13px 'Segoe UI', sans-serif";
  ctx.fillStyle = "rgba(253, 248, 231, 0.9)";
  const eventLong = registration.eventDateDisplay || "";
  const timeL = registration.eventTimeLabel || siteConfig.eventTimeLabel || "5:00 PM WAT";
  const ven = registration.venue || siteConfig.venue || "";
  const line = `${eventLong} · ${timeL} · ${ven}`;
  ctx.fillText(truncate(line, 85), leftX, stripY + 5);
  ctx.font = "12px 'Segoe UI', sans-serif";
  ctx.fillStyle = "rgba(212, 175, 55, 0.95)";
  const dress = registration.dressCode || siteConfig.dressCode || "";
  ctx.fillText(truncate(`Dress: ${dress}`.replace(/^Dress:\s*$/, "Dress: —"), 70), leftX, stripY + 28);

  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
  const outputPath = path.join(outputDir, `${safeName}.png`);
  fs.writeFileSync(outputPath, canvas.toBuffer("image/png"));
  return outputPath;
}

module.exports = { createTicketPng };
