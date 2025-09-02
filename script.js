// โหลด CSV แบบ Promise
function loadCSV(file) {
  return new Promise((resolve) => {
    Papa.parse(file, {
      download: true,
      header: true,
      complete: (results) => resolve(results.data),
    });
  });
}

function getParam(name) {
  return new URLSearchParams(window.location.search).get(name);
}

function normalizeId(v) {
  return String(v ?? "").trim().replace(/\.0$/, "");
}

async function initClassPage() {
  const list = document.getElementById("student-list");
  const search = document.getElementById("searchInput");
  if (!list || !search) return;

  const className = getParam("class");
  if (!className) return;

  const students = await loadCSV("assignment-checker - Students.csv");
  const filtered = students.filter((s) => (s["ชั้น"] || "").trim() === className);

  function render(items) {
    list.innerHTML = "";
    items.forEach((s) => {
      const id = normalizeId(s["รหัสนักเรียน"]);
      const name = `${s["ชื่อ"]} ${s["นามสกุล"]}`;
      const li = document.createElement("li");
      li.innerHTML = `<a href="student.html?id=${encodeURIComponent(id)}">${name}</a>`;
      list.appendChild(li);
    });
  }

  render(filtered);

  search.addEventListener("input", () => {
    const term = search.value.toLowerCase();
    const items = filtered.filter((s) =>
      (`${s["ชื่อ"]} ${s["นามสกุล"]}` || "").toLowerCase().includes(term)
    );
    render(items);
  });
}

window.addEventListener("DOMContentLoaded", initClassPage);

// student.html
(async function () {
  if (!document.getElementById("result")) return;

  const studentId = getParam("id");
  const students = await loadCSV("assignment-checker - Students.csv");
  const assignments = await loadCSV("assignment-checker - Assignments.csv");
  const submissions = await loadCSV("assignment-checker - Submissions.csv");

  const student = students.find((s) => normalizeId(s["รหัสนักเรียน"]) === studentId);
  const submission = submissions.find((s) => normalizeId(s["รหัสนักเรียน"]) === studentId);

  if (!student) {
    document.getElementById("result").innerHTML = "<p>ไม่พบนักเรียน</p>";
    return;
  }

  assignments.sort((a,b) => (+a["ครั้งที่"] || 0) - (+b["ครั้งที่"] || 0));

  let html = `
    <div class="info-box">
      <h2>${student["ชื่อ"]} ${student["นามสกุล"]}</h2>
      <p><b>รหัสนักเรียน:</b> ${student["รหัสนักเรียน"]}</p>
      <p><b>ชั้น:</b> ${student["ชั้น"]} <b>เลขที่:</b> ${student["เลขที่"]}</p>
      <p><b>เทอม:</b> ${student["เทอม"]}</p>
    </div>
  `;

  html += `<table>
    <tr>
      <th>ครั้งที่</th>
      <th>ชื่องาน</th>
      <th>รายละเอียด</th>
      <th>เทอม</th>
      <th>สถานะ</th>
    </tr>`;

  assignments.forEach((a) => {
    const idx = a["ครั้งที่"];
    const status = submission ? (submission[idx] || "ยังไม่ส่ง") : "ยังไม่ส่ง";

    let cls = "missing";
    let emoji = "❌";
    if (String(status).includes("ส่งแล้ว")) { cls = "done"; emoji = "✅"; }
    else if (String(status).includes("ช้า")) { cls = "late"; emoji = "⚠️"; }

    html += `
      <tr>
        <td>${idx}</td>
        <td>${a["ชื่องาน"] || ""}</td>
        <td>${a["รายละเอียด"] || ""}</td>
        <td>${a["เทอม"] || ""}</td>
        <td class="${cls}">${status} ${emoji}</td>
      </tr>
    `;
  });

  html += `</table>`;
  document.getElementById("result").innerHTML = html;
})();
