const COLLAPSED = { width: 204, height: 40 };
const EXPANDED = { width: 432, height: 464 };
function notchBounds(display, expanded) {
  const area = display.workArea;
  const size = expanded ? EXPANDED : COLLAPSED;
  const width = Math.min(size.width, area.width), height = Math.min(size.height, area.height);
  return { x: Math.round(area.x + (area.width - width) / 2), y: area.y, width, height };
}
function safeWebsite(value) {
  if (typeof value !== 'string' || value.length > 2048) return null;
  try {
    const url = new URL(value);
    if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password) return null;
    return url.href;
  } catch { return null; }
}
module.exports = { notchBounds, safeWebsite };
