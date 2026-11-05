
const analyzeButton = document.getElementById("analyzeButton");
const analyzeUploadedDocumentButton = document.getElementById("analyzeUploadedDocumentButton");
const resultText = document.getElementById("resultText");

const newTaskInput = document.getElementById("newTaskInput");
const addTaskButton = document.getElementById("addTaskButton");
const newTaskDeadline = document.getElementById("newTaskDeadline");

const addCalendarButton = document.getElementById("addCalendarButton");
const calendarStatus = document.getElementById("calendarStatus");
const pageAnalysisResult = document.getElementById("pageAnalysisResult");
const pageSummary = document.getElementById("pageSummary");
const addPageAnalysisToCalendarButton = document.getElementById("addPageAnalysisToCalendarButton");
const pageCalendarStatus = document.getElementById("pageCalendarStatus");
let latestPageAnalysis = null;

analyzeUploadedDocumentButton.addEventListener("click", () => {
  chrome.tabs.create({ url: chrome.runtime.getURL("document.html") });
});

// 할 일 목록 저장하기
// 할 일 목록 저장하기
async function saveTasks() {
  const taskLabels = resultText.querySelectorAll("label");
  const tasks = [];

  taskLabels.forEach(label => {
    const checkbox = label.querySelector("input[type='checkbox']");
    const taskText = label.querySelector("span");

    if (checkbox && taskText) {
      tasks.push({
        text: taskText.textContent,
        deadline: label.dataset.deadline || null,
        completed: checkbox.checked,
        calendarEventId: label.dataset.calendarEventId || null
      });
    }
  });

  try {
    await chrome.storage.local.set({ tasks });
    console.log("할 일 저장 성공!");
  } catch (error) {
    console.error("할 일 저장 실패:", error);
  }
}

// 직접 입력한 할 일을 체크리스트에 추가
addTaskButton.addEventListener("click", () => {
  const task = newTaskInput.value.trim();
  const deadline = newTaskDeadline.value;

  if (task === "") {
    alert("할 일을 입력해 주세요.");
    return;
  }

  // 기존 안내 문구 제거
  let heading = resultText.querySelector("h3");

  if (!heading) {
    resultText.replaceChildren();

    heading = document.createElement("h3");
    heading.textContent = "내 할 일";
    resultText.appendChild(heading);
  }

  // 할 일 항목 만들기
  const label = document.createElement("label");
  label.style.display = "block";
  label.style.margin = "10px 0";

  // 마감일 저장
  label.dataset.deadline = deadline || "";
  label.dataset.calendarEventId = "";

  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.style.marginRight = "8px";

  const taskText = document.createElement("span");
  taskText.textContent = task;

  // 마감일 표시
  const deadlineText = document.createElement("small");

  if (deadline) {
    deadlineText.textContent = ` (마감일: ${deadline})`;
    deadlineText.style.color = "#d97706";
  } else {
    deadlineText.textContent = " (마감일 확인 필요)";
    deadlineText.style.color = "#888";
  }

  // 완료 상태 저장
  checkbox.addEventListener("change", () => {
    taskText.style.textDecoration =
      checkbox.checked ? "line-through" : "none";

    saveTasks();
  });

  // 수정 버튼
  const editButton = document.createElement("button");
  editButton.textContent = "수정";
  editButton.type = "button";

  editButton.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();

    const newText = prompt(
      "수정할 내용을 입력하세요.",
      taskText.textContent
    );

    if (newText !== null && newText.trim() !== "") {
      taskText.textContent = newText.trim();
      saveTasks();
    }
  });

  // 삭제 버튼
  const deleteButton = document.createElement("button");
  deleteButton.textContent = "삭제";
  deleteButton.type = "button";

  deleteButton.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();

    label.remove();

    const remaining = resultText.querySelectorAll("label").length;
    heading.textContent = `내 할 일: ${remaining}개`;

    saveTasks();
  });

  // 화면에 추가
  label.append(
    checkbox,
    taskText,
    deadlineText,
    editButton,
    deleteButton
  );

  resultText.appendChild(label);

  // 개수 갱신
  const total = resultText.querySelectorAll("label").length;
  heading.textContent = `내 할 일: ${total}개`;

  // 저장
  saveTasks();

  // 입력창 비우기
  newTaskInput.value = "";
  newTaskDeadline.value = "";
});

// AI 분석 결과에서 할 일을 기존 체크리스트에 추가하기
function showChecklist(tasks) {
  // 기존 분석 중 메시지 제거
  const messages = resultText.querySelectorAll("p");
  messages.forEach(message => message.remove());

  // 기존 제목 찾기
  let heading = resultText.querySelector("h3");

  if (!heading) {
    heading = document.createElement("h3");
    resultText.prepend(heading);
  }

  // 기존 할 일 문구 확인
  const existingTasks = Array.from(
    resultText.querySelectorAll("label span")
  ).map(span => span.textContent);

// 기존에 없는 할 일만 추가
const newTasks = tasks.filter(
  task => !existingTasks.includes(task.text)
);

  newTasks.forEach(task => {
    const label = document.createElement("label");
    label.style.display = "block";
    label.style.margin = "10px 0";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.style.marginRight = "8px";

   const taskText = document.createElement("span");
taskText.textContent = task.text;

// 마감일 표시
const deadlineText = document.createElement("small");

if (task.deadline) {
  deadlineText.textContent = ` (마감일: ${task.deadline})`;
  deadlineText.style.color = "#d97706";
} else {
  deadlineText.textContent = " (마감일 확인 필요)";
  deadlineText.style.color = "#888";
}

label.dataset.deadline = task.deadline || "";
    checkbox.addEventListener("change", () => {
      taskText.style.textDecoration =
        checkbox.checked ? "line-through" : "none";
      saveTasks();
    });

    const editButton = document.createElement("button");
    editButton.textContent = "수정";
    editButton.type = "button";

    editButton.addEventListener("click", event => {
      event.preventDefault();
      event.stopPropagation();

      const newText = prompt(
        "수정할 내용을 입력하세요.",
        taskText.textContent
      );

      if (newText !== null && newText.trim() !== "") {
        taskText.textContent = newText.trim();
        saveTasks();
      }
    });

    const deleteButton = document.createElement("button");
    deleteButton.textContent = "삭제";
    deleteButton.type = "button";

    deleteButton.addEventListener("click", event => {
      event.preventDefault();
      event.stopPropagation();

      label.remove();

      const remaining =
        resultText.querySelectorAll("label").length;

      heading.textContent = `내 할 일: ${remaining}개`;
      saveTasks();
    });

   label.append(
  checkbox,
  taskText,
  deadlineText,
  editButton,
  deleteButton
);
    resultText.appendChild(label);
  });

  // 전체 할 일 개수 갱신
  const total = resultText.querySelectorAll("label").length;
  heading.textContent = `내 할 일: ${total}개`;

  saveTasks();

  if (tasks.length === 0 && total === 0) {
    const message = document.createElement("p");
    message.textContent = "할 일 후보를 찾지 못했어요.";
    resultText.appendChild(message);
  }
}

// 3. 분석 버튼을 눌렀을 때 실행
analyzeButton.addEventListener("click", async () => {
  analyzeButton.disabled = true;
  latestPageAnalysis = null;
  pageAnalysisResult.hidden = true;
  resultText.textContent = "선택한 공지 내용을 AI가 분석하고 있어요...";
  try {
    const [tab] = await chrome.tabs.query({
      active: true,
      lastFocusedWindow: true
    });
    if (!tab?.id || !tab.url || /^(chrome|edge|about|devtools):/i.test(tab.url)) {
      throw new Error("학교 공지 페이지를 열고 분석할 문장을 드래그해 선택해 주세요.");
    }

    const pageResults = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => ({
        text: window.getSelection()?.toString().trim() || "",
        title: document.title,
        url: location.href,
      }),
    });
    const page = pageResults?.[0]?.result;
    if (!page?.text) {
      throw new Error("분석할 공지 내용을 먼저 드래그해 선택해 주세요.");
    }

    const response = await fetch(`${globalThis.HAEZOOM_API_BASE_URL}/api/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: page.text.slice(0, 45000) }),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.error?.message || `AI 분석 실패 (${response.status})`);

    latestPageAnalysis = { ...payload.result, sourceTitle: page.title, sourceUrl: page.url };
    pageSummary.textContent = latestPageAnalysis.summary || "요약을 생성하지 못했습니다.";
    pageAnalysisResult.hidden = false;
    await loadTasks();
    showChecklist(latestPageAnalysis.tasks.map((task) => ({
      text: `${task.title}${task.action ? `: ${task.action}` : ""}`,
      deadline: task.deadline,
    })));
    const eligibleCount = getPageCalendarEntries(latestPageAnalysis).length;
    const skippedCount = latestPageAnalysis.schedules.length + latestPageAnalysis.tasks.length - eligibleCount;
    addPageAnalysisToCalendarButton.disabled = eligibleCount === 0;
    pageCalendarStatus.textContent = eligibleCount
      ? `${eligibleCount}개 등록 가능${skippedCount ? ` · ${skippedCount}개는 날짜 확인 또는 검토가 필요해 제외` : ""}`
      : "날짜가 확정된 일정이나 마감 업무가 없습니다.";
  } catch (error) {
    console.error("선택 공지 AI 분석 실패:", error);
    resultText.textContent = error.message.includes("Failed to fetch")
      ? "로컬 AI 서버에 연결할 수 없습니다. 터미널에서 npm start를 실행했는지 확인해 주세요."
      : error.message;
  } finally {
    analyzeButton.disabled = false;
  }
});
// 저장된 할 일 목록 불러오기
async function loadTasks() {
  const data = await chrome.storage.local.get("tasks");
  const tasks = data.tasks || [];

  resultText.replaceChildren();

  const heading = document.createElement("h3");
  heading.textContent = `내 할 일: ${tasks.length}개`;
  resultText.appendChild(heading);

  tasks.forEach(task => {
    const label = document.createElement("label");
    label.style.display = "block";
    label.style.margin = "10px 0";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = task.completed;
    checkbox.style.marginRight = "8px";

    const taskText = document.createElement("span");
taskText.textContent = task.text;

// 저장된 마감일 불러오기
label.dataset.deadline = task.deadline || "";
label.dataset.calendarEventId = task.calendarEventId || "";

const deadlineText = document.createElement("small");

if (task.deadline) {
  deadlineText.textContent = ` (마감일: ${task.deadline})`;
  deadlineText.style.color = "#d97706";
} else {
  deadlineText.textContent = " (마감일 확인 필요)";
  deadlineText.style.color = "#888";
}

if (task.completed) {
  taskText.style.textDecoration = "line-through";
}

    checkbox.addEventListener("change", () => {
      taskText.style.textDecoration =
        checkbox.checked ? "line-through" : "none";

      saveTasks();
    });

    const editButton = document.createElement("button");
    editButton.textContent = "수정";
    editButton.type = "button";

    editButton.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();

      const newText = prompt(
        "수정할 내용을 입력하세요.",
        taskText.textContent
      );

      if (newText !== null && newText.trim() !== "") {
        taskText.textContent = newText.trim();
        saveTasks();
      }
    });

    const deleteButton = document.createElement("button");
    deleteButton.textContent = "삭제";
    deleteButton.type = "button";

    deleteButton.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();

      label.remove();

      const remaining = resultText.querySelectorAll("label").length;
      heading.textContent = `내 할 일: ${remaining}개`;

      saveTasks();
    });

    label.append(
  checkbox,
  taskText,
  deadlineText,
  editButton,
  deleteButton
);
    resultText.appendChild(label);
  });
}

// 팝업을 열면 저장된 목록 불러오기
// 팝업을 열면 저장된 목록 불러오기
loadTasks().catch(error => {
    console.error("할 일 불러오기 실패:", error);
});

addPageAnalysisToCalendarButton.addEventListener("click", addPageAnalysisToCalendar);

function parsePageDateRange(value) {
  if (typeof value !== "string") return null;
  const isRange = /부터|까지|~|～|–|—/.test(value);
  const datePattern = /20\d{2}\s*(?:년|[./-])\s*\d{1,2}\s*(?:월|[./-])\s*\d{1,2}\s*일?/g;
  const tokens = [...value.matchAll(datePattern)].map(([token]) => token);
  if (!tokens.length || (isRange && tokens.length < 2) || (!isRange && tokens.length !== 1)) return null;

  const parseDate = (token) => {
    const match = token.match(/^(20\d{2})\s*(?:년|[./-])\s*(\d{1,2})\s*(?:월|[./-])\s*(\d{1,2})\s*일?$/);
    if (!match) return null;
    const [, yearText, monthText, dayText] = match;
    const year = Number(yearText);
    const month = Number(monthText);
    const day = Number(dayText);
    const date = new Date(Date.UTC(year, month - 1, day));
    if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return null;
    return `${yearText}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  };

  const start = parseDate(tokens[0]);
  const lastDate = parseDate(tokens.at(-1));
  if (!start || !lastDate) return null;
  const end = getNextCalendarDate(lastDate);
  if (start >= end) return null;
  return { start, end, isRange };
}

function getNextCalendarDate(value) {
  const [year, month, day] = value.split("-").map(Number);
  const next = new Date(Date.UTC(year, month - 1, day + 1));
  return `${next.getUTCFullYear()}-${String(next.getUTCMonth() + 1).padStart(2, "0")}-${String(next.getUTCDate()).padStart(2, "0")}`;
}

function parsePageTime(value) {
  if (typeof value !== "string") return null;
  const match = value.trim().match(/^(오전|오후)?\s*([0-9]{1,2})(?::([0-9]{2})|시(?:\s*([0-9]{1,2})분?)?)?$/);
  if (!match) return null;
  const [, meridiem, hourText, minuteText, koreanMinuteText] = match;
  let hour = Number(hourText);
  const minute = Number(minuteText || koreanMinuteText || 0);
  if (minute > 59) return null;
  if (meridiem) {
    if (hour < 1 || hour > 12) return null;
    hour = (hour % 12) + (meridiem === "오후" ? 12 : 0);
  } else if (!minuteText || hour > 23) {
    return null;
  }
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

function getPageCalendarEntries(analysis) {
  const events = [
    ...analysis.schedules.map((schedule) => ({ kind: "schedule", item: schedule })),
    ...analysis.tasks.map((task) => ({ kind: "task", item: task })),
  ];
  return events.map(({ kind, item }) => {
    if (item.needs_review) return null;
    const range = parsePageDateRange(kind === "schedule" ? item.date : item.deadline);
    if (!range) return null;
    const description = kind === "schedule"
      ? [item.details, item.evidence ? `근거: ${item.evidence}` : ""]
      : [
          item.action ? `할 일: ${item.action}` : "",
          item.materials?.length ? `준비물: ${item.materials.join(", ")}` : "",
          item.cost !== null && item.cost !== undefined ? `비용: ${item.cost.toLocaleString("ko-KR")}원` : "",
          item.submission ? `제출처: ${item.submission}` : "",
          item.evidence ? `근거: ${item.evidence}` : "",
        ];
    const event = {
      summary: item.title,
      description: [...description.filter(Boolean), `출처: ${latestPageAnalysis.sourceTitle}`, latestPageAnalysis.sourceUrl].join("\n\n"),
    };
    if (kind === "schedule" && item.location) event.location = item.location;
    const time = kind === "schedule" && !range.isRange ? parsePageTime(item.time) : null;
    if (time) {
      const startDateTime = `${range.start}T${time}:00+09:00`;
      event.start = { dateTime: startDateTime, timeZone: "Asia/Seoul" };
      event.end = {
        dateTime: new Date(Date.parse(startDateTime) + 60 * 60 * 1000).toISOString(),
        timeZone: "Asia/Seoul",
      };
    } else {
      event.start = { date: range.start };
      event.end = { date: range.end };
    }
    return event;
  }).filter(Boolean);
}

function getGoogleCalendarToken() {
  return new Promise((resolve, reject) => {
    chrome.identity.getAuthToken({ interactive: true }, (token) => {
      const error = chrome.runtime.lastError;
      if (error) reject(new Error(error.message));
      else if (!token) reject(new Error("Google Calendar 인증 토큰을 받지 못했습니다."));
      else resolve(token);
    });
  });
}

async function getCalendarEventKey(event) {
  const bytes = new TextEncoder().encode(JSON.stringify(event));
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function addPageAnalysisToCalendar() {
  if (!latestPageAnalysis) return;
  const events = getPageCalendarEntries(latestPageAnalysis);
  addPageAnalysisToCalendarButton.disabled = true;
  pageCalendarStatus.textContent = "Google 계정 인증 중...";
  try {
    const token = await getGoogleCalendarToken();
    const stored = await chrome.storage.local.get("haezoomCalendarEventIds");
    const eventIds = stored.haezoomCalendarEventIds || {};
    let created = 0;
    let duplicates = 0;
    let failed = 0;
    for (const event of events) {
      try {
        const key = await getCalendarEventKey(event);
        if (eventIds[key]) {
          duplicates += 1;
          continue;
        }
        const response = await fetch("https://www.googleapis.com/calendar/v3/calendars/primary/events", {
          method: "POST",
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          body: JSON.stringify(event),
        });
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(payload.error?.message || response.statusText);
        eventIds[key] = payload.id;
        await chrome.storage.local.set({ haezoomCalendarEventIds: eventIds });
        created += 1;
      } catch (error) {
        console.error("페이지 분석 결과 캘린더 등록 실패:", error);
        failed += 1;
      }
    }
    pageCalendarStatus.textContent = `등록 ${created}개 · 이미 등록 ${duplicates}개${failed ? ` · 실패 ${failed}개` : ""}`;
  } catch (error) {
    pageCalendarStatus.textContent = `Google Calendar 연결 실패: ${error.message}`;
  } finally {
    addPageAnalysisToCalendarButton.disabled = events.length === 0;
  }
}

const googleLoginButton = document.getElementById("googleLoginButton");
const googleStatus = document.getElementById("googleStatus");

googleLoginButton.addEventListener("click", function () {
    googleStatus.textContent = "Google 계정 인증 중...";

    chrome.identity.getAuthToken(
        { interactive: true },
        function (token) {
            const authError = chrome.runtime.lastError;

            if (authError) {
                console.error("Google 인증 실패:", authError.message);
                googleStatus.textContent =
                    "인증 실패: " + authError.message;
                return;
            }

            if (!token) {
                console.error("Google 인증 실패: 토큰이 없습니다.");
                googleStatus.textContent = "인증 실패: 토큰이 없습니다.";
                return;
            }

            console.log("Google 인증 성공!");
            googleStatus.textContent =
                "Google 계정이 연결되었습니다!";
        }
    );
});

// Google Calendar에 미완료 할 일 등록하기
addCalendarButton.addEventListener("click", function () {
    calendarStatus.textContent = "일정을 등록하고 있어요...";

    // 마감일이 있고, 완료되지 않았으며,
    // 아직 캘린더에 등록되지 않은 할 일만 선택
    const labels = Array.from(resultText.querySelectorAll("label"));

    const targets = labels.filter(label => {
        const checkbox = label.querySelector("input[type='checkbox']");
        const taskText = label.querySelector("span");

        return (
            checkbox &&
            taskText &&
            !checkbox.checked &&
            label.dataset.deadline &&
            !label.dataset.calendarEventId
        );
    });

    if (targets.length === 0) {
        calendarStatus.textContent =
            "등록할 미완료 할 일이 없어요. 마감일도 확인해 주세요.";
        return;
    }

    // 이미 연결된 Google 계정의 인증 토큰 가져오기
    chrome.identity.getAuthToken(
        { interactive: false },
        async function (token) {
            const authError = chrome.runtime.lastError;

            if (authError || !token) {
                calendarStatus.textContent =
                    "Google 계정 인증을 다시 확인해 주세요.";
                console.error(
                    "Google 인증 오류:",
                    authError?.message || "토큰이 없습니다."
                );
                return;
            }

            let successCount = 0;
            let failCount = 0;

            for (const label of targets) {
                const taskText = label.querySelector("span");
                const deadline = label.dataset.deadline;

                try {
                    // 종일 일정의 종료일은 시작일 다음 날로 설정
                    const [year, month, day] = deadline.split("-").map(Number);
                    const nextDay = new Date(
                        Date.UTC(year, month - 1, day + 1)
                    );
                    const endDate = nextDay.toISOString().slice(0, 10);

                    const response = await fetch(
                        "https://www.googleapis.com/calendar/v3/calendars/primary/events",
                        {
                            method: "POST",
                            headers: {
                                "Authorization": "Bearer " + token,
                                "Content-Type": "application/json"
                            },
                            body: JSON.stringify({
                                summary: taskText.textContent,
                                description: "해줌 AI에서 등록한 할 일입니다.",
                                start: {
                                    date: deadline
                                },
                                end: {
                                    date: endDate
                                }
                            })
                        }
                    );

                    if (!response.ok) {
                        const errorData = await response.json();
                        throw new Error(
                            errorData.error?.message || response.statusText
                        );
                    }

                    const event = await response.json();

                    // 등록한 일정 ID 저장
                    label.dataset.calendarEventId = event.id;
                    successCount++;

                    await saveTasks();

                } catch (error) {
                    console.error("일정 등록 실패:", error);
                    failCount++;
                }
            }

            calendarStatus.textContent =
                `등록 성공 ${successCount}개 / 실패 ${failCount}개`;
        }
    );
});
