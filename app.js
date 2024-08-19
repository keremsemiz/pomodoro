document.addEventListener('DOMContentLoaded', () => {
    const taskForm = document.getElementById('task-form');
    const taskNameInput = document.getElementById('task-name');
    const taskList = document.getElementById('task-list');
    const startTimerButton = document.getElementById('start-timer');
    const pauseTimerButton = document.getElementById('pause-timer');
    const resetTimerButton = document.getElementById('reset-timer');
    const timerDisplay = document.getElementById('timer-display');

    let tasks = [];
    let timerInterval;
    let timerMinutes = 25;
    let timerSeconds = 0;

    taskForm.addEventListener('submit', (event) => {
        event.preventDefault();
        const taskName = taskNameInput.value.trim();
        if (taskName !== '') {
            addTask(taskName);
            taskNameInput.value = '';
        }
    });

    startTimerButton.addEventListener('click', startTimer);
    pauseTimerButton.addEventListener('click', pauseTimer);
    resetTimerButton.addEventListener('click', resetTimer);

    function addTask(name) {
        const task = { id: Date.now(), name };
        tasks.push(task);
        renderTasks();
    }

    function renderTasks() {
        taskList.innerHTML = '';
        tasks.forEach(task => {
            const taskItem = document.createElement('div');
            taskItem.textContent = task.name;
            taskList.appendChild(taskItem);
        });
    }

    function startTimer() {
        if (!timerInterval) {
            timerInterval = setInterval(() => {
                if (timerSeconds === 0) {
                    if (timerMinutes === 0) {
                        clearInterval(timerInterval);
                        timerInterval = null;
                        alert('Pomodoro session completed!');
                    } else {
                        timerMinutes--;
                        timerSeconds = 59;
                    }
                } else {
                    timerSeconds--;
                }
                updateTimerDisplay();
            }, 1000);
        }
    }

    function pauseTimer() {
        if (timerInterval) {
            clearInterval(timerInterval);
            timerInterval = null;
        }
    }

    function resetTimer() {
        clearInterval(timerInterval);
        timerInterval = null;
        timerMinutes = 25;
        timerSeconds = 0;
        updateTimerDisplay();
    }

    function updateTimerDisplay() {
        const minutes = String(timerMinutes).padStart(2, '0');
        const seconds = String(timerSeconds).padStart(2, '0');
        timerDisplay.textContent = `${minutes}:${seconds}`;
    }

    updateTimerDisplay();
});
