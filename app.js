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
        const task = { id: Date.now(), name, project: selectedProject };
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
        tasks
            .filter(task => task.project === selectedProject)
            .forEach(task => {
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

    function saveProjects() {
        localStorage.setItem('projects', JSON.stringify(projects));
    }

    function saveTasks() {
        localStorage.setItem('tasks', JSON.stringify(tasks));
    }

    renderProjects();
    renderTasks();
    updateTimerDisplay();
});

