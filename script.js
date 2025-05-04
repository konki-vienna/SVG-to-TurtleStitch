const pathColors = [
  "#FF6F61",
  "#6B5B93",
  "#88B04B",
  "#F7CAC9",
  "#92A8D1",
  "#955251",
  "#E4B5B2",
  "#F9C74F",
  "#90BE6D",
  "#F94144",
  "#F3722C",
  "#F8961E",
  "#277DA1",
  "#FF9B85",
  "#F9C74F",
  "#43AA8B",
  "#F94144",
  "#90BE6D",
  "#577590",
  "#F9C74F",
  "#F3722C",
  "#F8961E",
  "#4D908E",
  "#FFC300",
  "#FF5733",
  "#C70039",
  "#900C3F",
  "#581845",
  "#FF8D1B",
  "#FFB300",
  "#D1C6E7",
  "#6A0572",
  "#A9DFBF",
  "#F5B041",
  "#D35400",
  "#1F618D",
  "#F1948A",
  "#7D3C98",
  "#5D6D7E",
  "#F4D03F",
  "#E67E22",
  "#2980B9",
  "#16A085",
  "#1ABC9C",
  "#2ECC71",
  "#27AE60",
  "#D5DBDB",
  "#F7DC6F",
  "#B03A2E",
  "#F5B7B1",
];

let currentPath = null;
let originalViewBox = null;
let allPaths = [];
let pointsPerPath = [];
let csvData = [];
let accumulatedCSV = "";

const getPointsAlongPath = (path, interval) => {
  const points = [];
  const pathLength = path.getTotalLength();
  for (let distance = 0; distance <= pathLength; distance += interval) {
    const point = path.getPointAtLength(distance);
    points.push([
      Math.round(point.x * 100) / 100,
      Math.round(point.y * 100) / 100,
    ]);
  }
  return points;
};

const updatePreview = (svgContent) => {
  const parser = new DOMParser();
  const svgDoc = parser.parseFromString(svgContent, "image/svg+xml");
  const paths = Array.from(svgDoc.querySelectorAll("path"));

  if (paths.length === 0) {
    alert("No paths found in SVG file");
    return;
  }

  allPaths = paths;
  pointsPerPath = [];
  csvData = [];

  const preview = document.getElementById("pathPreview");
  preview.innerHTML = "";

  const originalSvg = svgDoc.querySelector("svg");
  const viewBox = originalSvg.getAttribute("viewBox") || "0 0 100 100";
  preview.setAttribute("viewBox", viewBox);
  originalViewBox = viewBox;

  const [vbX, vbY, vbWidth, vbHeight] = viewBox.split(" ").map(Number);
  const aspectRatio = vbHeight / vbWidth;
  const width = Math.min(900, window.innerWidth - 80);
  const height = width * aspectRatio;

  preview.style.width = `${width}px`;
  preview.style.height = `${height}px`;

  paths.forEach((originalPath, index) => {
    const newPath = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "path"
    );
    newPath.setAttribute("d", originalPath.getAttribute("d"));
    newPath.setAttribute("stroke", pathColors[index % pathColors.length]);
    newPath.setAttribute("fill", "none");
    newPath.setAttribute("stroke-width", "1");
    preview.appendChild(newPath);
  });

  document.getElementById("dimensions").innerHTML = `
	  Dimensions: ${width.toFixed(0)}px × ${height.toFixed(0)}px<br>
	  ViewBox: ${vbX} ${vbY} ${vbWidth} ${vbHeight}<br>
	`;

  analyzeAllPaths();
};

const analyzeAllPaths = () => {
  if (!allPaths.length) return;

  const interval = parseFloat(document.getElementById("interval").value);
  const preview = document.getElementById("pathPreview");

  preview.querySelectorAll(".dot").forEach((dot) => dot.remove());

  let totalPoints = 0;
  csvData = [];
  pointsPerPath = [];

  preview.querySelectorAll("path").forEach((path, pathIndex) => {
    const points = getPointsAlongPath(path, interval);
    pointsPerPath[pathIndex] = points.length;
    totalPoints += points.length;

    points.forEach(([x, y]) => {
      const dot = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "circle"
      );
      dot.setAttribute("cx", x);
      dot.setAttribute("cy", y);
      dot.setAttribute("class", "dot");
      dot.setAttribute("fill", pathColors[pathIndex % pathColors.length]);
      preview.appendChild(dot);

      csvData.push({ pathIndex: pathIndex + 1, x, y });
    });
  });

  document.getElementById(
    "stats"
  ).textContent = `Total paths: ${allPaths.length}, Total points: ${totalPoints}`;
};

document.getElementById("fileInput").addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => updatePreview(e.target.result);
  reader.readAsText(file);
});

document.getElementById("interval").addEventListener("change", analyzeAllPaths);
document.getElementById("copyButton").addEventListener("click", () => {
  const accumulate = document.getElementById("accumulateClipboard").checked;
  const csvOutput = csvData
    .map(({ pathIndex, x, y }) => `${pathIndex},${x},${y}`)
    .join("\n");

  if (accumulate) {
    accumulatedCSV += csvOutput + "\n";
  } else {
    accumulatedCSV = csvOutput;
  }

  navigator.clipboard.writeText(accumulatedCSV).then(() => {
    showToast("Copied to clipboard!");
  });
});

document
  .getElementById("clearClipboardButton")
  .addEventListener("click", () => {
    accumulatedCSV = "";
    showToast("Clipboard cleared!");
  });

const showToast = (message) => {
  const toastContainer = document.getElementById("toastContainer");
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.textContent = message;

  toastContainer.appendChild(toast);
  setTimeout(() => {
    toast.remove();
  }, 3000);
};
