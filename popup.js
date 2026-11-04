
const analyzeButton = document.getElementById("analyzeButton");
const analyzeUploadedDocumentButton = document.getElementById("analyzeUploadedDocumentButton");
const resultText = document.getElementById("resultText");

const newTaskInput = document.getElementById("newTaskInput");
const addTaskButton = document.getElementById("addTaskButton");
const newTaskDeadline = document.getElementById("newTaskDeadline");

const addCalendarButton = document.getElementById("addCalendarButton");
const calendarStatus = document.getElementById("calendarStatus");

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


 // 1. 웹페이지에서 실제 해야 할 일 후보 찾기

function extractTasks(pageText) {
  const lines = pageText
    .replace(/\r/g, "\n")
    .split(/\n+/)
    .map(line => line.replace(/\s+/g, " ").trim())
    .filter(line => line.length >= 5);

  const actionPattern =
    /제출|신청|접수|납부|준비물|가져오|지참|참석|참가|참여|등록|예약|신청서|제출서류|회신|응답|동의서|마감|제출해야|신청해야|까지 제출|까지 신청|참석 바랍니다|제출할 것|신청할 것|작성하여|제출해 주|신청해 주|참여해 주|신청 기간|제출 기한|신청 방법|제출 방법|기간 내|기한 내/;

  const noisePattern =
    /해당 기간에 .*없습니다|학사일정|홈으로|로그인|회원가입|사이트맵|메뉴|검색|개인정보처리방침|이용약관/;

  const tasks = [];

  for (const line of lines) {
    if (noisePattern.test(line)) continue;
    if (!actionPattern.test(line)) continue;

    // 날짜 찾기
    let dateMatch = line.match(
      /(20\d{2})\s*년\s*(\d{1,2})\s*월\s*(\d{1,2})\s*일?/
    );

    // 연도가 없는 날짜 찾기
    if (!dateMatch) {
      const shortMatch = line.match(
        /(\d{1,2})\s*월\s*(\d{1,2})\s*일/
      );

      if (shortMatch) {
        dateMatch = [
          shortMatch[0],
          new Date().getFullYear(),
          shortMatch[1],
          shortMatch[2]
        ];
      }
    }

    let deadline = null;

    if (dateMatch) {
      const year = Number(dateMatch[1]);
      const month = Number(dateMatch[2]);
      const day = Number(dateMatch[3]);

      const date = new Date(year, month - 1, day);

      // 실제 존재하는 날짜인지 확인
      if (
        date.getFullYear() === year &&
        date.getMonth() === month - 1 &&
        date.getDate() === day
      ) {
        deadline =
          `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      }
    }

    if (!tasks.some(task => task.text === line)) {
      tasks.push({
        text: line,
        deadline: deadline
      });
    }
  }

  return tasks.slice(0, 20);
}


// 2. 체크리스트 화면 만들기

// 2. AI 분석 결과를 기존 목록에 추가하기
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
  const loadingMessage = document.createElement("p");
loadingMessage.textContent = "웹페이지에서 할 일을 찾고 있어요...";
resultText.appendChild(loadingMessage);
  try {
    const [tab] = await chrome.tabs.query({
  active: true,
  lastFocusedWindow: true
});

    
if (!tab || !tab.id) {
  resultText.textContent = "현재 탭을 찾을 수 없어요.";
  return;
}

if (
  !tab.url ||
  /^(chrome|edge|about|devtools):/i.test(tab.url)
) {
  resultText.textContent =
    "크롬 설정 화면은 분석할 수 없어요. 네이버나 학교 공지사항을 열어 주세요.";
  return;
}


const statusMessage = document.createElement("p");
statusMessage.textContent =
  "분석 대상 주소: " + tab.url +
  "\n페이지 읽기를 시도하는 중...";

resultText.appendChild(statusMessage);
let results;

try {
  results = await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: () => document.body.innerText
  });
} catch (error) {
  resultText.textContent =
    "분석 대상 주소:\n" + tab.url +
    "\n\n오류 종류: " + error.name +
    "\n오류 내용: " + error.message;
  return;
}


    const pageText = results?.[0]?.result?.trim();

    if (!pageText) {
  const errorMessage = document.createElement("p");
  errorMessage.textContent =
    "읽을 수 있는 글이 없습니다. 일반 웹페이지에서 시도해 주세요.";
  resultText.appendChild(errorMessage);
  return;
}

    const tasks = extractTasks(pageText);
    showChecklist(tasks);

  } catch (error) {
  console.error("해줌 AI 오류:", error);

  resultText.textContent =
    "오류 종류: " + error.name +
    "\n오류 내용: " + error.message;
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
