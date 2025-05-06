document.addEventListener('DOMContentLoaded', () => {
    // Elements
    const processQueueInput = document.getElementById('process-queue');
    const bufferSizeInput = document.getElementById('buffer-size');
    const speedInput = document.getElementById('speed');
    const speedValue = document.getElementById('speed-value');
    const startBtn = document.getElementById('start-btn');
    const pauseBtn = document.getElementById('pause-btn');
    const resetBtn = document.getElementById('reset-btn');
    const bufferElement = document.getElementById('buffer');
    const activeProcesses = document.getElementById('active-processes');
    const stepDisplay = document.getElementById('step-display');
    const currentStatus = document.getElementById('current-status');
    const logContainer = document.getElementById('log-container');
    const emptyCount = document.getElementById('empty-count');
    const fullCount = document.getElementById('full-count');
    
    // State
    let simulation = new Simulation();
    let steps = [];
    let currentStep = -1;
    let isRunning = false;
    let timerId = null;
    
    // Create buffer slots
    function createBuffer(size) {
        bufferElement.innerHTML = '';
        for (let i = 0; i < size; i++) {
            const slot = document.createElement('div');
            slot.className = 'buffer-slot empty';
            slot.setAttribute('data-index', i);
            bufferElement.appendChild(slot);
        }
    }
    
    // Update buffer visualization
    function updateBuffer(buffer) {
        if (!buffer) return;
        
        emptyCount.textContent = buffer.empty;
        fullCount.textContent = buffer.full;
        
        // Update buffer slots
        const slots = bufferElement.querySelectorAll('.buffer-slot');
        slots.forEach((slot, index) => {
            if (buffer.slots[index]) {
                slot.textContent = buffer.slots[index];
                slot.className = 'buffer-slot filled';
                
                // Highlight producing or consuming action
                if (buffer.producedSlot === index && buffer.currentProducer) {
                    slot.className = 'buffer-slot filled producing';
                } else if (buffer.consumingSlot === index && buffer.currentConsumer) {
                    slot.className = 'buffer-slot filled consuming';
                }
            } else {
                slot.textContent = '';
                slot.className = 'buffer-slot empty';
            }
        });
        
        // Update active processes
        activeProcesses.innerHTML = '';
        
        // Show current process in action (producer/consumer/waiting)
        if (buffer.currentProducer) {
            const producerTag = document.createElement('div');
            producerTag.className = 'process-tag producer';
            producerTag.textContent = buffer.currentProducer;
            activeProcesses.appendChild(producerTag);
        }
        
        if (buffer.currentConsumer) {
            const consumerTag = document.createElement('div');
            consumerTag.className = 'process-tag consumer';
            consumerTag.textContent = buffer.currentConsumer;
            activeProcesses.appendChild(consumerTag);
        }
    }
    
    // Add log entry
    function addLogEntry(log) {
        if (logContainer.querySelector('.placeholder-text')) {
            logContainer.innerHTML = '';
        }
        
        const entry = document.createElement('div');
        entry.className = `log-entry ${log.type}`;
        entry.innerHTML = `<time>[${log.time}]</time> ${log.message}`;
        logContainer.appendChild(entry);
        logContainer.scrollTop = logContainer.scrollHeight;
    }
    
    // Update step display
    function updateStepDisplay() {
        if (currentStep === -1) {
            stepDisplay.textContent = 'Ready';
        } else {
            stepDisplay.textContent = `Step: ${currentStep + 1} / ${steps.length}`;
        }
    }
    
    // Animation control
    function startAnimation() {
        if (currentStep >= steps.length - 1) return;
        
        isRunning = true;
        startBtn.disabled = true;
        pauseBtn.disabled = false;
        processQueueInput.disabled = true;
        bufferSizeInput.disabled = true;
        
        function animate() {
            if (!isRunning || currentStep >= steps.length - 1) {
                isRunning = false;
                startBtn.disabled = false;
                pauseBtn.disabled = true;
                processQueueInput.disabled = false;
                bufferSizeInput.disabled = false;
                return;
            }
            
            currentStep++;
            const step = steps[currentStep];
            
            updateBuffer(step.buffer);
            updateStepDisplay();
            currentStatus.textContent = step.status;
            addLogEntry(step.log);
            
            timerId = setTimeout(animate, parseInt(speedInput.value));
        }
        
        animate();
    }
    
    // Initialize buffer when size changes
    bufferSizeInput.addEventListener('change', () => {
        const size = parseInt(bufferSizeInput.value);
        createBuffer(size);
        emptyCount.textContent = size;
        fullCount.textContent = 0;
    });
    
    // Event Listeners
    startBtn.addEventListener('click', () => {
        if (currentStep === -1) {
            const bufferSize = parseInt(bufferSizeInput.value);
            createBuffer(bufferSize);
            steps = simulation.run(processQueueInput.value, bufferSize);
            currentStep = -1;
        }
        startAnimation();
    });
    
    pauseBtn.addEventListener('click', () => {
        isRunning = false;
        startBtn.disabled = false;
        pauseBtn.disabled = true;
        if (timerId) clearTimeout(timerId);
    });
    
    resetBtn.addEventListener('click', () => {
        if (timerId) clearTimeout(timerId);
        isRunning = false;
        currentStep = -1;
        steps = [];
        startBtn.disabled = false;
        pauseBtn.disabled = true;
        processQueueInput.disabled = false;
        bufferSizeInput.disabled = false;
        
        const bufferSize = parseInt(bufferSizeInput.value);
        createBuffer(bufferSize);
        emptyCount.textContent = bufferSize;
        fullCount.textContent = 0;
        activeProcesses.innerHTML = '';
        
        updateStepDisplay();
        currentStatus.textContent = 'Ready to start simulation';
        logContainer.innerHTML = '<div class="placeholder-text">Logs will appear here when simulation starts...</div>';
    });
    
    speedInput.addEventListener('input', () => {
        speedValue.textContent = `${speedInput.value}ms`;
    });
    
    // Initialize buffer on load
    createBuffer(parseInt(bufferSizeInput.value));
});