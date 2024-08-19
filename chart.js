document.addEventListener('DOMContentLoaded', () => {
    const totalTimeElement = document.getElementById('total-time');
    const averageSessionElement = document.getElementById('average-session');
    const completionRateElement = document.getElementById('completion-rate');
    const timeSpentChartElement = document.getElementById('time-spent-chart').getContext('2d');

    let timeSpentChart;

    function renderAnalytics() {
        const totalTimeSpent = sessionHistory.reduce((total, session) => total + session.duration, 0);
        const completedSessions = sessionHistory.filter(session => session.type === 'work').length;
        const totalTasks = tasks.length;
        const completedTasks = tasks.filter(task => task.timeSpent > 0).length;

        totalTimeElement.textContent = `Total Time Spent: ${formatTime(totalTimeSpent)}`;
        averageSessionElement.textContent = `Average Session Length: ${Math.round(totalTimeSpent / completedSessions / 60)}m`;
        completionRateElement.textContent = `Task Completion Rate: ${Math.round((completedTasks / totalTasks) * 100)}%`;

        const timeSpentPerTask = tasks.map(task => ({
            label: task.name,
            timeSpent: task.timeSpent / 3600 
        }));

        const labels = timeSpentPerTask.map(item => item.label);
        const data = timeSpentPerTask.map(item => item.timeSpent);

        if (timeSpentChart) {
            timeSpentChart.data.labels = labels;
            timeSpentChart.data.datasets[0].data = data;
            timeSpentChart.update();
        } else {
            timeSpentChart = new Chart(timeSpentChartElement, {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Time Spent on Tasks (hours)',
                        data: data,
                        backgroundColor: 'rgba(75, 192, 192, 0.2)',
                        borderColor: 'rgba(75, 192, 192, 1)',
                        borderWidth: 1
                    }]
                },
                options: {
                    scales: {
                        y: {
                            beginAtZero: true
                        }
                    }
                }
            });
        }
    }

    renderProjects();
    renderTasks();
    renderHistory();
    renderAnalytics();
    updateTimerDisplay();
});
