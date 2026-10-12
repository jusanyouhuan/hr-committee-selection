/* 人力资源部新委员选拔 · 交互脚本 */
(function () {
  "use strict";

  /* ===== 移动端导航 ===== */
  var toggle = document.querySelector(".nav-toggle");
  var links = document.querySelector(".nav-links");
  if (toggle && links) {
    toggle.addEventListener("click", function () {
      links.classList.toggle("open");
    });
    links.addEventListener("click", function (e) {
      if (e.target.tagName === "A") links.classList.remove("open");
    });
  }

  /* ===== 权重条形图：进入视口后展开 ===== */
  var fills = document.querySelectorAll(".weight-row .fill");
  if ("IntersectionObserver" in window && fills.length) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          var pct = en.target.getAttribute("data-pct");
          en.target.style.width = pct + "%";
          io.unobserve(en.target);
        }
      });
    }, { threshold: 0.3 });
    fills.forEach(function (f) { io.observe(f); });
  } else {
    fills.forEach(function (f) { f.style.width = f.getAttribute("data-pct") + "%"; });
  }

  /* ===== 评分计算器 ===== */
  var calcRoot = document.getElementById("calculator");
  if (!calcRoot) return;

  // 维度：[名称, 满分]，最后一项为加分项
  var DIMS = [
    ["动机与岗位认知", 10],
    ["思想品德与责任心", 15],
    ["语言表达与沟通", 15],
    ["逻辑思维与应变", 15],
    ["团队协作与服务", 10],
    ["组织协调与执行", 10],
    ["文档与办公技能", 10],
    ["时间精力与稳定性", 10],
    ["仪容仪表与精神面貌", 5],
    ["加分项(≤5)", 5]
  ];

  var tbody = document.getElementById("judge-rows");
  var judgeCount = 0;

  function clamp(v, max) {
    if (isNaN(v)) return null;
    if (v < 0) v = 0;
    if (v > max) v = max;
    return v;
  }

  function addJudge() {
    judgeCount++;
    var tr = document.createElement("tr");
    tr.className = "judge-row";
    var html = '<td><input class="name-in" type="text" value="评委' + judgeCount + '"></td>';
    DIMS.forEach(function (d, i) {
      html += '<td><input type="number" min="0" max="' + d[1] + '" step="0.5" data-dim="' + i + '" placeholder="0-' + d[1] + '"></td>';
    });
    html += '<td class="total">0.0</td>';
    html += '<td><button class="del-btn" title="删除该评委" type="button">✕</button></td>';
    tr.innerHTML = html;
    tbody.appendChild(tr);
    tr.querySelectorAll("input[type=number]").forEach(function (inp) {
      inp.addEventListener("input", function () {
        var idx = +inp.getAttribute("data-dim");
        var v = clamp(parseFloat(inp.value), DIMS[idx][1]);
        if (v !== null && inp.value !== "") inp.value = v;
        recalc();
      });
    });
    tr.querySelector(".del-btn").addEventListener("click", function () {
      tr.parentNode.removeChild(tr);
      recalc();
    });
    recalc();
  }

  function rowTotal(tr) {
    var sum = 0, filled = false;
    tr.querySelectorAll("input[type=number]").forEach(function (inp) {
      if (inp.value !== "") { sum += parseFloat(inp.value); filled = true; }
    });
    return filled ? sum : null;
  }

  function recalc() {
    var rows = tbody.querySelectorAll(".judge-row");
    var totals = [];
    rows.forEach(function (tr) {
      var t = rowTotal(tr);
      tr.querySelector(".total").textContent = t === null ? "—" : t.toFixed(1);
      if (t !== null) totals.push(t);
    });

    var n = totals.length;
    var finalScore = null;
    var ruleText = "—";
    if (n > 0) {
      var sorted = totals.slice().sort(function (a, b) { return a - b; });
      var used = sorted;
      if (n >= 5) {
        used = sorted.slice(1, sorted.length - 1); // 去掉一个最高、一个最低
        ruleText = n + " 位评委：去掉1个最高分、1个最低分后平均";
      } else {
        ruleText = n + " 位评委：直接取算术平均";
      }
      var sum = used.reduce(function (a, b) { return a + b; }, 0);
      finalScore = sum / used.length;
    }

    document.getElementById("r-count").textContent = n;
    document.getElementById("r-rule").textContent = ruleText;
    var scoreEl = document.getElementById("r-score");
    var gradeEl = document.getElementById("r-grade");
    var verdictEl = document.getElementById("r-verdict");

    if (finalScore === null) {
      scoreEl.textContent = "—";
      gradeEl.textContent = "—";
      verdictEl.className = "verdict";
      verdictEl.textContent = "请在上方录入评委分数，结果将自动计算";
      return;
    }

    scoreEl.textContent = finalScore.toFixed(2);

    var grade, cls, msg;
    if (finalScore >= 90) { grade = "优秀"; }
    else if (finalScore >= 75) { grade = "良好"; }
    else if (finalScore >= 70) { grade = "合格"; }
    else { grade = "不合格"; }
    gradeEl.textContent = grade;

    if (finalScore >= 70) {
      cls = "verdict pass";
      msg = "达到录取合格线（70 分），建议按岗位名额由高到低录取";
    } else {
      cls = "verdict fail";
      msg = "未达到录取合格线（70 分），不予录取（宁缺毋滥，不降格录取）";
    }
    verdictEl.className = cls;
    verdictEl.textContent = msg;
  }

  document.getElementById("add-judge").addEventListener("click", addJudge);
  document.getElementById("clear-all").addEventListener("click", function () {
    tbody.innerHTML = "";
    judgeCount = 0;
    addJudge();
    addJudge();
    addJudge();
  });

  // 初始化 3 位评委
  addJudge(); addJudge(); addJudge();
})();
