class Simulation {
    constructor() {
        this.steps = [];
        this.time = 0;
    }

    run(processQueue, bufferSize) {
        this.steps = [];
        this.time = 0;
        
        // Initialize buffer
        const buffer = {
            size: bufferSize,
            slots: Array(bufferSize).fill(null),
            empty: bufferSize,
            full: 0,
            mutex: true,
            nextSlot: 0, // Next slot to produce to
            nextConsume: 0 // Next slot to consume from
        };
        
        // Parse process queue
        const processes = processQueue.split(',').map(p => ({
            id: p.trim(),
            type: p.trim().startsWith('p') ? 'producer' : 'consumer'
        }));
        
        const waitingProducers = [];
        const waitingConsumers = [];
        
        // Initial state
        this.addStep(
            'Simulation started',
            {...buffer},
            'Simulation started. Buffer is empty.',
            'info'
        );
        
        // Process each action
        for (const process of processes) {
            if (process.type === 'producer') {
                // Producer checks if buffer is full
                if (buffer.full >= buffer.size) {
                    waitingProducers.push(process.id);
                    this.addStep(
                        `Producer ${process.id} waiting for empty slot`,
                        {...buffer},
                        `${process.id} waiting because buffer is full`,
                        'waiting'
                    );
                    continue;
                }
                
                // Producer tries to acquire mutex
                if (!buffer.mutex) {
                    waitingProducers.push(process.id);
                    this.addStep(
                        `Producer ${process.id} waiting for mutex`,
                        {...buffer},
                        `${process.id} waiting for mutex to access buffer`,
                        'waiting'
                    );
                    continue;
                }
                
                // Producer acquires mutex
                buffer.mutex = false;
                this.addStep(
                    `Producer ${process.id} acquired mutex`,
                    {...buffer},
                    `${process.id} acquired mutex to produce item`,
                    'mutex'
                );
                
                // Decrement empty count
                buffer.empty--;
                this.addStep(
                    `${process.id} decremented empty (${buffer.empty + 1} → ${buffer.empty})`,
                    {...buffer},
                    `${process.id} decremented empty count from ${buffer.empty + 1} to ${buffer.empty}`,
                    'producer'
                );
                
                // Produce item to buffer
                const produceIndex = buffer.nextSlot;
                buffer.slots[produceIndex] = process.id;
                buffer.nextSlot = (buffer.nextSlot + 1) % buffer.size;
                
                this.addStep(
                    `${process.id} produced item in slot ${produceIndex}`,
                    {...buffer, currentProducer: process.id, producedSlot: produceIndex},
                    `${process.id} produced item in buffer slot ${produceIndex}`,
                    'producer'
                );
                
                // Release mutex
                buffer.mutex = true;
                this.addStep(
                    `${process.id} released mutex`,
                    {...buffer, currentProducer: null},
                    `${process.id} released mutex after producing`,
                    'mutex'
                );
                
                // Increment full count
                buffer.full++;
                this.addStep(
                    `${process.id} incremented full (${buffer.full - 1} → ${buffer.full})`,
                    {...buffer},
                    `${process.id} incremented full count from ${buffer.full - 1} to ${buffer.full}`,
                    'producer'
                );
                
                // Check waiting consumers if buffer now has items
                if (buffer.full > 0 && waitingConsumers.length > 0) {
                    const nextConsumer = waitingConsumers.shift();
                    this.addStep(
                        `Consumer ${nextConsumer} can now proceed`,
                        {...buffer},
                        `${nextConsumer} can now consume as buffer has items`,
                        'waiting'
                    );
                }
                
            } else { // Consumer process
                // Consumer checks if buffer is empty
                if (buffer.full <= 0) {
                    waitingConsumers.push(process.id);
                    this.addStep(
                        `Consumer ${process.id} waiting for item`,
                        {...buffer},
                        `${process.id} waiting because buffer is empty`,
                        'waiting'
                    );
                    continue;
                }
                
                // Consumer tries to acquire mutex
                if (!buffer.mutex) {
                    waitingConsumers.push(process.id);
                    this.addStep(
                        `Consumer ${process.id} waiting for mutex`,
                        {...buffer},
                        `${process.id} waiting for mutex to access buffer`,
                        'waiting'
                    );
                    continue;
                }
                
                // Decrement full count
                buffer.full--;
                this.addStep(
                    `${process.id} decremented full (${buffer.full + 1} → ${buffer.full})`,
                    {...buffer},
                    `${process.id} decremented full count from ${buffer.full + 1} to ${buffer.full}`,
                    'consumer'
                );
                
                // Consumer acquires mutex
                buffer.mutex = false;
                this.addStep(
                    `${process.id} acquired mutex`,
                    {...buffer},
                    `${process.id} acquired mutex to consume item`,
                    'mutex'
                );
                
                // Consume item from buffer
                const consumeIndex = buffer.nextConsume;
                const item = buffer.slots[consumeIndex];
                
                this.addStep(
                    `${process.id} consuming item from slot ${consumeIndex}`,
                    {...buffer, currentConsumer: process.id, consumingSlot: consumeIndex},
                    `${process.id} consuming item produced by ${item} from slot ${consumeIndex}`,
                    'consumer'
                );
                
                buffer.slots[consumeIndex] = null;
                buffer.nextConsume = (buffer.nextConsume + 1) % buffer.size;
                
                // Release mutex
                buffer.mutex = true;
                this.addStep(
                    `${process.id} released mutex`,
                    {...buffer, currentConsumer: null, consumingSlot: null},
                    `${process.id} released mutex after consuming`,
                    'mutex'
                );
                
                // Increment empty count
                buffer.empty++;
                this.addStep(
                    `${process.id} incremented empty (${buffer.empty - 1} → ${buffer.empty})`,
                    {...buffer},
                    `${process.id} incremented empty count from ${buffer.empty - 1} to ${buffer.empty}`,
                    'consumer'
                );
                
                // Check waiting producers if buffer now has space
                if (buffer.empty > 0 && waitingProducers.length > 0) {
                    const nextProducer = waitingProducers.shift();
                    this.addStep(
                        `Producer ${nextProducer} can now proceed`,
                        {...buffer},
                        `${nextProducer} can now produce as buffer has space`,
                        'waiting'
                    );
                }
            }
        }
        
        this.addStep(
            'Simulation complete',
            {...buffer},
            'Simulation complete',
            'info'
        );
        
        return this.steps;
    }
    
    addStep(status, buffer, logMessage, logType) {
        this.steps.push({
            status,
            buffer: JSON.parse(JSON.stringify(buffer)),
            log: {
                time: this.time++,
                message: logMessage,
                type: logType
            }
        });
    }
}