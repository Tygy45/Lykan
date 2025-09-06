class Calculator {
    constructor(previousOperandElement, currentOperandElement) {
        this.previousOperandElement = previousOperandElement;
        this.currentOperandElement = currentOperandElement;
        this.memory = 0;
        this.clear();
    }

    clear() {
        this.currentOperand = '';
        this.previousOperand = '';
        this.operation = undefined;
        this.updateDisplay();
    }

    clearAll() {
        this.clear();
        this.memory = 0;
    }

    clearEntry() {
        this.currentOperand = '';
        this.updateDisplay();
    }

    memoryClear() {
        this.memory = 0;
    }

    memoryRecall() {
        if (this.memory !== 0) {
            this.currentOperand = this.memory.toString();
            this.updateDisplay();
        }
    }

    memoryAdd() {
        if (this.currentOperand !== '') {
            const current = parseFloat(this.currentOperand);
            if (!isNaN(current)) {
                this.memory += current;
            }
        }
    }

    memorySubtract() {
        if (this.currentOperand !== '') {
            const current = parseFloat(this.currentOperand);
            if (!isNaN(current)) {
                this.memory -= current;
            }
        }
    }

    memoryUnit() {
        // MU (Memory Unit) - обычно используется для вычисления маржи или процентов
        if (this.currentOperand !== '') {
            const current = parseFloat(this.currentOperand);
            if (!isNaN(current)) {
                // Простое вычисление: текущее значение * 1.2 (20% наценка)
                const result = current * 1.2;
                this.currentOperand = result;
                this.updateDisplay();
            }
        }
    }

    delete() {
        this.currentOperand = this.currentOperand.toString().slice(0, -1);
        this.updateDisplay();
    }

    appendNumber(number) {
        if (number === '.' && this.currentOperand.includes('.')) return;
        this.currentOperand = this.currentOperand.toString() + number.toString();
        this.updateDisplay();
    }

    squareRoot() {
        if (this.currentOperand !== '') {
            const current = parseFloat(this.currentOperand);
            if (!isNaN(current) && current >= 0) {
                const result = Math.sqrt(current);
                this.currentOperand = result;
                this.updateDisplay();
            } else if (current < 0) {
                alert('Ошибка: нельзя извлечь корень из отрицательного числа!');
            }
        }
    }

    percentage() {
        if (this.currentOperand !== '') {
            const current = parseFloat(this.currentOperand);
            if (!isNaN(current)) {
                const result = current / 100;
                this.currentOperand = result;
                this.updateDisplay();
            }
        }
    }

    toggleSign() {
        if (this.currentOperand !== '') {
            const current = parseFloat(this.currentOperand);
            if (!isNaN(current)) {
                this.currentOperand = (-current).toString();
                this.updateDisplay();
            }
        }
    }

    chooseOperation(operation) {
        if (this.currentOperand === '') return;
        if (this.previousOperand !== '') {
            this.compute();
        }
        this.operation = operation;
        this.previousOperand = this.currentOperand;
        this.currentOperand = '';
        this.updateDisplay();
    }

    compute() {
        let computation;
        const prev = parseFloat(this.previousOperand);
        const current = parseFloat(this.currentOperand);
        
        if (isNaN(prev) || isNaN(current)) return;
        
        switch (this.operation) {
            case '+':
                computation = prev + current;
                break;
            case '-':
                computation = prev - current;
                break;
            case '×':
                computation = prev * current;
                break;
            case '÷':
                if (current === 0) {
                    alert('Ошибка: деление на ноль!');
                    return;
                }
                computation = prev / current;
                break;
            default:
                return;
        }
        
        
        this.currentOperand = computation;
        this.operation = undefined;
        this.previousOperand = '';
        this.updateDisplay();
    }

    getDisplayNumber(number) {
        const stringNumber = number.toString();
        const integerDigits = parseFloat(stringNumber.split('.')[0]);
        const decimalDigits = stringNumber.split('.')[1];
        let integerDisplay;
        
        if (isNaN(integerDigits)) {
            integerDisplay = '';
        } else {
            integerDisplay = integerDigits.toLocaleString('ru-RU', { maximumFractionDigits: 0 });
        }
        
        if (decimalDigits != null) {
            return `${integerDisplay}.${decimalDigits}`;
        } else {
            return integerDisplay;
        }
    }

    updateDisplay() {
        this.currentOperandElement.innerText = this.getDisplayNumber(this.currentOperand) || '0';
        
        if (this.operation != null) {
            this.previousOperandElement.innerText = 
                `${this.getDisplayNumber(this.previousOperand)} ${this.operation}`;
        } else {
            this.previousOperandElement.innerText = '';
        }
    }
}


// Инициализация
const previousOperandElement = document.getElementById('previous-operand');
const currentOperandElement = document.getElementById('current-operand');

const calculator = new Calculator(previousOperandElement, currentOperandElement);

// Обработка клавиатуры
document.addEventListener('keydown', function(event) {
    const key = event.key;
    
    if (key >= '0' && key <= '9' || key === '.') {
        calculator.appendNumber(key);
    } else if (key === '+' || key === '-') {
        calculator.chooseOperation(key);
    } else if (key === '*') {
        calculator.chooseOperation('×');
    } else if (key === '/') {
        event.preventDefault();
        calculator.chooseOperation('÷');
    } else if (key === 'Enter' || key === '=') {
        calculator.compute();
    } else if (key === 'Escape' || key === 'c' || key === 'C') {
        calculator.clear();
    } else if (key === 'Backspace') {
        calculator.delete();
    }
});

// Анимация кнопок
document.querySelectorAll('.btn').forEach(button => {
    button.addEventListener('click', function() {
        this.style.transform = 'scale(0.95)';
        setTimeout(() => {
            this.style.transform = '';
        }, 150);
    });
});
