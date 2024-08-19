document.addEventListener('DOMContentLoaded', () => {
    const taskForm = document.getElementById('task-form');
    const taskNameInput = document.getElementById('task-name');
    const taskList = document.getElementById('task-list');
    const projectSelect = document.getElementById('project-select');
    const addProjectButton = document.getElementById('add-project');
    const startTimerButton = document.getElementById('start-timer');
    const pauseTimerButton = document.getElementById('pause-timer');
    const resetTimerButton = document.getElementById('reset-timer');
    const timerDisplay = document.getElementById('timer-display');

    let projects = JSON.parse(localStorage.getItem('projects')) || ['Default Project'];
    let selectedProject = projects[0];
    let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
    let sessionHistory = JSON.parse(localStorage.getItem('sessionHistory')) || [];
    let timerInterval;
    let timerMinutes = 25;
    let timerSeconds = 0;
    let activeTask = null;
    let isBreak = false;
    let shortBreakMinutes = 5;
    let longBreakMinutes = 15;
    let completedSessions = 0;

    taskForm.addEventListener('submit', (event) => {
        event.preventDefault();
        const taskName = taskNameInput.value.trim();
        if (taskName !== '') {
            addTask(taskName);
            taskNameInput.value = '';
        }
    });

    addProjectButton.addEventListener('click', () => {
        const projectName = prompt('Enter project name:');
        if (projectName) {
            addProject(projectName.trim());
        }
    });

    projectSelect.addEventListener('change', (event) => {
        selectedProject = event.target.value;
        renderTasks();
    });

    startTimerButton.addEventListener('click', startTimer);
    pauseTimerButton.addEventListener('click', pauseTimer);
    resetTimerButton.addEventListener('click', resetTimer);

    function addProject(name) {
        projects.push(name);
        saveProjects();
        renderProjects();
    }

    function renderProjects() {
        projectSelect.innerHTML = '';
        projects.forEach(project => {
            const option = document.createElement('option');
            option.value = project;
            option.textContent = project;
            if (project === selectedProject) {
                option.selected = true;
            }
            projectSelect.appendChild(option);
        });
    }

    function addTask(name) {
        const task = { id: Date.now(), name, project: selectedProject, timeSpent: 0 };
        tasks.push(task);
        saveTasks();
        renderTasks();
    }

    function editTask(id, newName) {
        tasks = tasks.map(task => task.id === id ? { ...task, name: newName } : task);
        saveTasks();
        renderTasks();
    }

    function deleteTask(id) {
        tasks = tasks.filter(task => task.id !== id);
        saveTasks();
        renderTasks();
    }

    function selectTask(id) {
        activeTask = tasks.find(task => task.id === id);
        resetTimer();
    }

    function renderTasks() {
        taskList.innerHTML = '';
        tasks
            .filter(task => task.project === selectedProject)
            .forEach(task => {
                const completedSessions = sessionHistory.filter(session => session.taskId === task.id).length;
                const taskItem = document.createElement('div');
                taskItem.classList.add('task-item');
                taskItem.innerHTML = `
                    <span>${task.name} - ${formatTime(task.timeSpent)} - Sessions: ${completedSessions}</span>
                    <button class="select-task" data-id="${task.id}">Select</button>
                    <button class="edit-task" data-id="${task.id}">Edit</button>
                    <button class="delete-task" data-id="${task.id}">Delete</button>
                `;
                taskList.appendChild(taskItem);
            });

        document.querySelectorAll('.select-task').forEach(button => {
            button.addEventListener('click', (event) => {
                const id = parseInt(event.target.getAttribute('data-id'));
                selectTask(id);
            });
        });

        document.querySelectorAll('.edit-task').forEach(button => {
            button.addEventListener('click', (event) => {
                const id = parseInt(event.target.getAttribute('data-id'));
                const newName = prompt('Edit Task Name:', tasks.find(task => task.id === id).name);
                if (newName) {
                    editTask(id, newName.trim());
                }
            });
        });

        document.querySelectorAll('.delete-task').forEach(button => {
            button.addEventListener('click', (event) => {
                const id = parseInt(event.target.getAttribute('data-id'));
                if (confirm('Are you sure you want to delete this task?')) {
                    deleteTask(id);
                }
            });
        });
    }

    function startTimer() {
        if (!timerInterval && activeTask) {
            timerInterval = setInterval(() => {
                if (timerSeconds === 0) {
                    if (timerMinutes === 0) {
                        clearInterval(timerInterval);
                        timerInterval = null;
                        if (!isBreak) {
                            alert('Pomodoro session completed!');
                            activeTask.timeSpent += 1500; // 25 minutes * 60 seconds
                            saveTasks();
                            logSession(activeTask.id, 'work');
                            completedSessions++;
                            if (completedSessions % 4 === 0) {
                                startBreak(longBreakMinutes, 'long');
                            } else {
                                startBreak(shortBreakMinutes, 'short');
                            }
                        } else {
                            alert('Break time over!');
                            isBreak = false;
                            resetTimer();
                        }
                        renderTasks();
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

    function startBreak(minutes, type) {
        isBreak = true;
        document.body.classList.add('break-mode');
        timerMinutes = minutes;
        timerSeconds = 0;
        updateTimerDisplay();
        logSession(null, type);
        startTimer();
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
        document.body.classList.remove('break-mode');
        updateTimerDisplay();
    }

    function updateTimerDisplay() {
        const minutes = String(timerMinutes).padStart(2, '0');
        const seconds = String(timerSeconds).padStart(2, '0');
        timerDisplay.textContent = `${minutes}:${seconds}`;
        if (isBreak) {
            timerDisplay.style.color = 'hsl(0, 0%, 100%)';
        } else {
            timerDisplay.style.color = 'var(--display-text)';
        }
    }

    function formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const remainingMinutes = minutes % 60;
        return `${hours}h ${remainingMinutes}m`;
    }

    function logSession(taskId, sessionType) {
        const session = {
            taskId,
            timestamp: new Date().toISOString(),
            duration: sessionType === 'work' ? 1500 : sessionType === 'short' ? shortBreakMinutes * 60 : longBreakMinutes * 60,
            type: sessionType
        };
        sessionHistory.push(session);
        saveSessionHistory();
    }

    function saveProjects() {
        localStorage.setItem('projects', JSON.stringify(projects));
    }

    function saveTasks() {
        localStorage.setItem('tasks', JSON.stringify(tasks));
    }

    function saveSessionHistory() {
        localStorage.setItem('sessionHistory', JSON.stringify(sessionHistory));
    }

    function renderHistory() {
        const historyList = document.getElementById('history-list');
        historyList.innerHTML = '';
        sessionHistory.forEach(session => {
            const task = tasks.find(t => t.id === session.taskId) || { name: session.type === 'short' ? 'Short Break' : 'Long Break' };
            const sessionTypeLabel = session.type === 'work' ? 'Work Session' : session.type === 'short' ? 'Short Break' : 'Long Break';
            const historyItem = document.createElement('div');
            historyItem.classList.add('history-item');
            historyItem.innerHTML = `
                <span>${task.name} - ${sessionTypeLabel} - ${formatTime(session.duration)} - ${new Date(session.timestamp).toLocaleString()}</span>
            `;
            historyList.appendChild(historyItem);
        });
    }

    renderProjects();
    renderTasks();
    renderHistory();
    updateTimerDisplay();
});
