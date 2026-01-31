// 番茄时钟 - 主逻辑
class PomodoroTimer {
    constructor() {
        // 计时器状态
        this.isRunning = false;
        this.isPaused = false;
        this.timeLeft = 25 * 60; // 25分钟，单位：秒
        this.totalTime = 25 * 60;
        this.timerInterval = null;
        
        // 模式设置
        this.mode = 'work'; // work, short-break, long-break
        this.settings = {
            workDuration: 25, // 分钟
            shortBreakDuration: 5,
            longBreakDuration: 15,
            autoStart: true,
            soundAlert: true
        };
        
        // 统计数据
        this.stats = {
            completedSessions: 0,
            totalTime: 0, // 分钟
            todaySessions: 0,
            lastResetDate: new Date().toDateString()
        };
        
        // 任务列表
        this.tasks = [];
        
        this.init();
    }
    
    init() {
        this.loadSettings();
        this.loadStats();
        this.loadTasks();
        this.bindEvents();
        this.updateDisplay();
        this.updateStatsDisplay();
        this.renderTasks();
    }
    
    bindEvents() {
        // 控制按钮
        document.getElementById('start-btn').addEventListener('click', () => this.start());
        document.getElementById('pause-btn').addEventListener('click', () => this.pause());
        document.getElementById('reset-btn').addEventListener('click', () => this.reset());
        document.getElementById('skip-btn').addEventListener('click', () => this.skip());
        
        // 模式选择
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.selectMode(e.target.dataset.mode));
        });
        
        // 任务管理
        document.getElementById('add-task-btn').addEventListener('click', () => this.addTask());
        document.getElementById('task-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addTask();
        });
        
        // 设置
        document.getElementById('save-settings').addEventListener('click', () => this.saveSettings());
        
        // 设置输入框
        document.getElementById('work-duration').addEventListener('change', (e) => {
            this.settings.workDuration = parseInt(e.target.value);
        });
        document.getElementById('short-break-duration').addEventListener('change', (e) => {
            this.settings.shortBreakDuration = parseInt(e.target.value);
        });
        document.getElementById('long-break-duration').addEventListener('change', (e) => {
            this.settings.longBreakDuration = parseInt(e.target.value);
        });
        document.getElementById('auto-start').addEventListener('change', (e) => {
            this.settings.autoStart = e.target.checked;
        });
        document.getElementById('sound-alert').addEventListener('change', (e) => {
            this.settings.soundAlert = e.target.checked;
        });
    }
    
    start() {
        if (this.isRunning) return;
        
        this.isRunning = true;
        this.isPaused = false;
        
        // 更新按钮状态
        document.getElementById('start-btn').disabled = true;
        document.getElementById('pause-btn').disabled = false;
        
        // 添加专注模式样式
        if (this.mode === 'work') {
            document.body.classList.add('focus-mode');
            document.body.classList.remove('break-mode');
        } else {
            document.body.classList.add('break-mode');
            document.body.classList.remove('focus-mode');
        }
        
        // 开始计时
        this.timerInterval = setInterval(() => {
            this.timeLeft--;
            this.updateDisplay();
            
            // 更新进度条
            const progress = ((this.totalTime - this.timeLeft) / this.totalTime) * 100;
            document.getElementById('progress-bar').style.width = `${progress}%`;
            
            // 时间到
            if (this.timeLeft <= 0) {
                this.timerComplete();
            }
        }, 1000);
    }
    
    pause() {
        if (!this.isRunning || this.isPaused) return;
        
        this.isPaused = true;
        clearInterval(this.timerInterval);
        
        document.getElementById('pause-btn').innerHTML = '<i class="fas fa-play"></i> 继续';
        document.getElementById('pause-btn').classList.remove('btn-secondary');
        document.getElementById('pause-btn').classList.add('btn-primary');
    }
    
    reset() {
        this.stopTimer();
        this.setTimeForMode(this.mode);
        this.updateDisplay();
        
        // 重置按钮状态
        document.getElementById('start-btn').disabled = false;
        document.getElementById('pause-btn').disabled = true;
        document.getElementById('pause-btn').innerHTML = '<i class="fas fa-pause"></i> 暂停';
        document.getElementById('pause-btn').classList.remove('btn-primary');
        document.getElementById('pause-btn').classList.add('btn-secondary');
        
        // 移除模式样式
        document.body.classList.remove('focus-mode', 'break-mode');
    }
    
    skip() {
        this.stopTimer();
        
        // 切换到下一个模式
        if (this.mode === 'work') {
            this.completeWorkSession();
            this.selectMode('short-break');
        } else {
            this.selectMode('work');
        }
    }
    
    stopTimer() {
        this.isRunning = false;
        this.isPaused = false;
        clearInterval(this.timerInterval);
        this.timerInterval = null;
    }
    
    timerComplete() {
        this.stopTimer();
        
        // 播放提示音
        if (this.settings.soundAlert) {
            this.playSound();
        }
        
        // 显示通知
        this.showNotification();
        
        // 更新统计数据
        if (this.mode === 'work') {
            this.completeWorkSession();
            
            // 自动开始休息
            if (this.settings.autoStart) {
                setTimeout(() => {
                    this.selectMode('short-break');
                    this.start();
                }, 1000);
            }
        } else {
            // 休息结束，自动开始工作
            if (this.settings.autoStart) {
                setTimeout(() => {
                    this.selectMode('work');
                    this.start();
                }, 1000);
            }
        }
    }
    
    completeWorkSession() {
        this.stats.completedSessions++;
        this.stats.totalTime += this.settings.workDuration;
        
        // 检查是否是今天
        const today = new Date().toDateString();
        if (today !== this.stats.lastResetDate) {
            this.stats.todaySessions = 0;
            this.stats.lastResetDate = today;
        }
        this.stats.todaySessions++;
        
        this.saveStats();
        this.updateStatsDisplay();
        
        // 每4个番茄钟后切换到长休息
        if (this.stats.completedSessions % 4 === 0) {
            this.selectMode('long-break');
        }
    }
    
    selectMode(mode) {
        this.mode = mode;
        this.setTimeForMode(mode);
        
        // 更新模式按钮状态
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.mode === mode) {
                btn.classList.add('active');
            }
        });
        
        // 更新标签
        const labels = {
            'work': '专注时间',
            'short-break': '短休息',
            'long-break': '长休息'
        };
        document.getElementById('timer-label').textContent = labels[mode];
        
        // 重置计时器
        this.reset();
    }
    
    setTimeForMode(mode) {
        let minutes;
        switch (mode) {
            case 'work':
                minutes = this.settings.workDuration;
                break;
            case 'short-break':
                minutes = this.settings.shortBreakDuration;
                break;
            case 'long-break':
                minutes = this.settings.longBreakDuration;
                break;
        }
        
        this.timeLeft = minutes * 60;
        this.totalTime = minutes * 60;
    }
    
    updateDisplay() {
        const minutes = Math.floor(this.timeLeft / 60);
        const seconds = this.timeLeft % 60;
        document.getElementById('time').textContent = 
            `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    
    updateStatsDisplay() {
        document.getElementById('completed-sessions').textContent = this.stats.completedSessions;
        document.getElementById('total-time').textContent = this.stats.totalTime;
        document.getElementById('today-sessions').textContent = this.stats.todaySessions;
    }
    
    // 任务管理
    addTask() {
        const input = document.getElementById('task-input');
        const text = input.value.trim();
        
        if (text) {
            const task = {
                id: Date.now(),
                text: text,
                completed: false,
                createdAt: new Date()
            };
            
            this.tasks.push(task);
            this.saveTasks();
            this.renderTasks();
            input.value = '';
            input.focus();
        }
    }
    
    toggleTask(id) {
        const task = this.tasks.find(t => t.id === id);
        if (task) {
            task.completed = !task.completed;
            this.saveTasks();
            this.renderTasks();
        }
    }
    
    deleteTask(id) {
        this.tasks = this.tasks.filter(t => t.id !== id);
        this.saveTasks();
        this.renderTasks();
    }
    
    renderTasks() {
        const taskList = document.getElementById('task-list');
        taskList.innerHTML = '';
        
        this.tasks.forEach(task => {
            const li = document.createElement('li');
            li.className = 'task-item';
            li.innerHTML = `
                <div class="task-content">
                    <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''}>
                    <span class="task-text ${task.completed ? 'completed' : ''}">${task.text}</span>
                </div>
                <div class="task-actions">
                    <button class="task-action-btn delete-task" title="删除">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
            
            // 绑定事件
            const checkbox = li.querySelector('.task-checkbox');
            checkbox.addEventListener('change', () => this.toggleTask(task.id));
            
            const deleteBtn = li.querySelector('.delete-task');
            deleteBtn.addEventListener('click', () => this.deleteTask(task.id));
            
            taskList.appendChild(li);
        });
    }
    
    // 设置管理
    saveSettings() {
        localStorage.setItem('pomodoro-settings', JSON.stringify(this.settings));
        
        // 更新当前模式的时间
        this.setTimeForMode(this.mode);
        this.updateDisplay();
        
        // 显示保存成功提示
        this.showMessage('设置已保存！', 'success');
    }
    
    loadSettings() {
        const saved = localStorage.getItem('pomodoro-settings');
        if (saved) {
            this.settings = JSON.parse(saved);
            
            // 更新设置界面
            document.getElementById('work-duration').value = this.settings.workDuration;
            document.getElementById('short-break-duration').value = this.settings.shortBreakDuration;
            document.getElementById('long-break-duration').value = this.settings.longBreakDuration;
            document.getElementById('auto-start').checked = this.settings.autoStart;
            document.getElementById('sound-alert').checked = this.settings.soundAlert;
        }
    }
    
    saveStats() {
        localStorage.setItem('pomodoro-stats', JSON.stringify(this.stats));
    }
    
    loadStats() {
        const saved = localStorage.getItem('pomodoro-stats');
        if (saved) {
            this.stats = JSON.parse(saved);
            
            // 检查是否是今天
            const today = new Date().toDateString();
            if (today !== this.stats.lastResetDate) {
                this.stats.todaySessions = 0;
                this.stats.lastResetDate = today;
            }
        }
    }
    
    saveTasks() {
        localStorage.setItem('pomodoro-tasks', JSON.stringify(this.tasks));
    }
    
    loadTasks() {
        const saved = localStorage.getItem('pomodoro-tasks');
        if (saved) {
            this.tasks = JSON.parse(saved);
        }
    }
    
    // 辅助功能
    playSound() {
        const sound = document.getElementById('timer-sound');
        sound.currentTime = 0;
        sound.play().catch(e => console.log('音频播放失败:', e));
    }
    
    showNotification() {
        if (Notification.permission === 'granted') {
            const title = this.mode === 'work' ? '工作时间到！' : '休息时间到！';
            const body = this.mode === 'work' ? '该休息一下了！' : '该开始工作了！';
            
            new Notification(title, {
                body: body,
                icon: 'https://cdn-icons-png.flaticon.com/512/3208/3208720.png'
            });
        }
    }
    
    showMessage(text, type = 'info') {
        // 创建消息元素
        const message = document.createElement('div');
        message.className = `message message-${type}`;
        message.textContent = text;
        message.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 25px;
            background: ${type === 'success' ? '#38a169' : '#667eea'};
            color: white;
            border-radius: 10px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.2);
            z-index: 1000;
            animation: slideIn 0.3s ease;
        `;
        
        document.body.appendChild(message);
        
        // 3秒后移除
        setTimeout(() => {
            message.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => message.remove(), 300);
        }, 3000);
    }
    
    // 请求通知权限
    requestNotificationPermission() {
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }
    }
}

// 初始化番茄时钟
document.addEventListener('DOMContentLoaded', () => {
    const timer = new PomodoroTimer();
    
    // 请求通知权限
    timer.requestNotificationPermission();
    
    // 添加CSS动画
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOut {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(100%); opacity: 0; }
        }
    `;
    document.head.appendChild(style);
    
    console.log('🍅 番茄时钟已启动！');
});