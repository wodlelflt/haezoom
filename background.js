// 저장된 할 일의 알림을 설정하는 함수
async function scheduleTaskReminders() {
  // 기존 해줌 AI 알림 삭제
  const alarms = await chrome.alarms.getAll();

  for (const alarm of alarms) {
    if (alarm.name.startsWith("task-")) {
      await chrome.alarms.clear(alarm.name);
    }
  }

  // 저장된 할 일 가져오기
  const result = await chrome.storage.local.get("tasks");
  const tasks = result.tasks || [];

  const today = new Date();

  // 완료하지 않은 할 일만 확인
  for (const task of tasks) {
    if (task.completed || !task.deadline) {
      continue;
    }

    const [year, month, day] = task.deadline.split("-").map(Number);

    // 3일 전, 1일 전, 당일 알림 설정
    const reminderDays = [3, 1, 0];

    for (const days of reminderDays) {
      const reminderDate = new Date(
        year,
        month - 1,
        day - days,
        9,
        0,
        0
      );

      if (reminderDate <= today) {
        continue;
      }

      const alarmName =
        "task-" +
        encodeURIComponent(task.text) +
        "-" +
        task.deadline +
        "-" +
        days;

      await chrome.alarms.create(alarmName, {
        when: reminderDate.getTime()
      });
    }
  }
}

// 알림 시간이 되면 실행
chrome.alarms.onAlarm.addListener((alarm) => {
  if (!alarm.name.startsWith("task-")) {
    return;
  }

  const days = alarm.name.split("-").pop();

  let message = "";

  if (days === "3") {
    message = "마감일까지 3일 남았습니다.";
  } else if (days === "1") {
    message = "마감일까지 하루 남았습니다.";
  } else {
    message = "오늘이 할 일의 마감일입니다.";
  }

  chrome.notifications.create({
    type: "basic",
    iconUrl: "icon.png",
    title: "해줌 AI - 할 일 알림",
    message: message
  });
});

// 할 일 목록이 변경되면 알림 다시 설정
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "local" && changes.tasks) {
    scheduleTaskReminders().catch((error) => {
      console.error("알림 갱신 실패:", error);
    });
  }
});

// 확장 프로그램이 시작되면 알림 설정
scheduleTaskReminders();
// 테스트용 알림: 약 2분 뒤 실행
chrome.alarms.create("test-reminder", {
  delayInMinutes: 2
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "test-reminder") {
    chrome.notifications.create({
      type: "basic",
      iconUrl: "icon.png",
      title: "해줌 AI 테스트",
      message: "알림 기능이 정상적으로 작동합니다!"
    });
  }
});