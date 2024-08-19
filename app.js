document.addEventListener('DOMContentLoaded', () => {
    const taskForm = document.getElementById('task-form');
    const taskNameInput = document.getElementById('task-name');
    const taskList = document.getElementById('task-list');
    const startTimerButton = document.getElementById('start-timer');
    const pauseTimerButton = document.getElementById('pause-timer');
    const resetTimerButton = document.getElementById('reset-timer');
    const timerDisplay = document.getElementById('timer-display');

    let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
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

    function renderTasks() {
        taskList.innerHTML = '';
        tasks.forEach(task => {
            const taskItem = document.createElement('div');
            taskItem.classList.add('task-item');
            taskItem.innerHTML = `
                <span>${task.name}</span>
                <button class="edit-task" data-id="${task.id}">Edit</button>
                <button class="delete-task" data-id="${task.id}">Delete</button>
            `;
            taskList.appendChild(taskItem);
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

    function saveTasks() {
        localStorage.setItem('tasks', JSON.stringify(tasks));
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

    renderTasks();
    updateTimerDisplay();
});
