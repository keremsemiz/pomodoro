document.addEventListener('DOMContentLoaded', () => {
    const taskForm = document.getElementById('task-form');
    const taskNameInput = document.getElementById('task-name');
    const taskPrioritySelect = document.getElementById('task-priority');
    const taskList = document.getElementById('task-list');
    const projectSelect = document.getElementById('project-select');
    const addProjectButton = document.getElementById('add-project');
    const startTimerButton = document.getElementById('start-timer');
    const pauseTimerButton = document.getElementById('pause-timer');
    const resetTimerButton = document.getElementById('reset-timer');
    const timerDisplay = document.getElementById('timer-display');
    const settingsForm = document.getElementById('settings-form');
    const workDurationInput = document.getElementById('work-duration');
    const shortBreakDurationInput = document.getElementById('short-break-duration');
    const longBreakDurationInput = document.getElementById('long-break-duration');
    const timerModeDisplay = document.getElementById('timer-mode');
    const exportCsvButton = document.getElementById('export-csv');

    let projects = JSON.parse(localStorage.getItem('projects')) || ['Default Project'];
    let selectedProject = projects[0];
    let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
    let sessionHistory = JSON.parse(localStorage.getItem('sessionHistory')) || [];
    let timerInterval;
    let timerMinutes = 25;
    let timerSeconds = 0;
    let activeTask = null;
    let isBreak = false;
    let completedSessions = 0;

    let workDuration = parseInt(localStorage.getItem('workDuration')) || 25;
    let shortBreakMinutes = parseInt(localStorage.getItem('shortBreakDuration')) || 5;
    let longBreakMinutes = parseInt(localStorage.getItem('longBreakDuration')) || 15;

    workDurationInput.value = workDuration;
    shortBreakDurationInput.value = shortBreakMinutes;
    longBreakDurationInput.value = longBreakMinutes;

    if (Notification.permission === 'default') {
        Notification.requestPermission().then(permission => {
            if (permission === 'granted') {
                console.log('Notification permission granted.');
            }
        });
    }

    settingsForm.addEventListener('submit', (event) => {
        event.preventDefault();
        workDuration = parseInt(workDurationInput.value);
        shortBreakMinutes = parseInt(shortBreakDurationInput.value);
        longBreakMinutes = parseInt(longBreakDurationInput.value);
        saveSettings();
        resetTimer();
        alert('Settings saved!');
    });

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
    exportCsvButton.addEventListener('click', exportSessionData);

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
        const priority = taskPrioritySelect.value;
        const task = { id: Date.now(), name, project: selectedProject, priority, timeSpent: 0 };
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
            .sort((a, b) => priorityToValue(b.priority) - priorityToValue(a.priority))
            .forEach(task => {
                const completedSessions = sessionHistory.filter(session => session.taskId === task.id).length;
                const taskItem = document.createElement('div');
                taskItem.classList.add('task-item', `priority-${task.priority}`);
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

    function priorityToValue(priority) {
        if (priority === 'high') return 3;
        if (priority === 'medium') return 2;
        return 1;
    }

    function startTimer() {
        if (!timerInterval && activeTask) {
            updateTimerModeDisplay();
            timerInterval = setInterval(() => {
                if (timerSeconds === 0) {
                    if (timerMinutes === 0) {
                        clearInterval(timerInterval);
                        timerInterval = null;
                        if (!isBreak) {
                            notifyUser('Pomodoro Completed', 'Good job! Time for a break.');
                            alert('Pomodoro session completed!');
                            activeTask.timeSpent += workDuration * 60;
                            saveTasks();
                            logSession(activeTask.id, 'work');
                            completedSessions++;
                            if (completedSessions % 4 === 0) {
                                startBreak(longBreakMinutes, 'long');
                            } else {
                                startBreak(shortBreakMinutes, 'short');
                            }
                        } else {
                            notifyUser('Break Over', 'Time to get back to work!');
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
        updateTimerModeDisplay();
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
        timerMinutes = workDuration;
        timerSeconds = 0;
        document.body.classList.remove('break-mode');
        updateTimerModeDisplay();
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

    function updateTimerModeDisplay() {
        if (isBreak) {
            timerModeDisplay.textContent = 'Break Mode';
        } else {
            timerModeDisplay.textContent = 'Work Mode';
        }
    }

    function notifyUser(title, message) {
        if (Notification.permission === 'granted') {
            new Notification(title, { body: message });
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
            duration: sessionType === 'work' ? workDuration * 60 : sessionType === 'short' ? shortBreakMinutes * 60 : longBreakMinutes * 60,
            type: sessionType
        };
        sessionHistory.push(session);
        saveSessionHistory();
    }

    function exportSessionData() {
        let csvContent = "data:text/csv;charset=utf-8,";
        csvContent += "Task Name,Session Type,Duration (minutes),Date\n";

        sessionHistory.forEach(session => {
            const task = tasks.find(t => t.id === session.taskId) || { name: session.type === 'short' ? 'Short Break' : 'Long Break' };
            const sessionTypeLabel = session.type === 'work' ? 'Work Session' : session.type === 'short' ? 'Short Break' : 'Long Break';
            const durationMinutes = session.duration / 60;
            const date = new Date(session.timestamp).toLocaleString();
            csvContent += `${task.name},${sessionTypeLabel},${durationMinutes},${date}\n`;
        });

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', 'session_data.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    function saveSettings() {
        localStorage.setItem('workDuration', workDuration);
        localStorage.setItem('shortBreakDuration', shortBreakMinutes);
        localStorage.setItem('longBreakDuration', longBreakMinutes);
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
                <div>Task ID: ${session.taskId || 'N/A'}, Duration: ${session.duration / 60} minutes</div>
            `;
            historyList.appendChild(historyItem);
        });
    }

    renderProjects();
    renderTasks();
    renderHistory();
    updateTimerDisplay();
});
