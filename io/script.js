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

    memoryUnit() {
        // MU (Memory Unit) - обычно используется для вычисления маржи или процентов
        if (this.currentOperand !== '') {
            const current = parseFloat(this.currentOperand);
            if (!isNaN(current)) {
                // Простое вычисление: текущее значение * 1.2 (20% наценка)
                const result = current * 1.2;
                const expression = `${this.currentOperand} MU (×1.2)`;
                historyManager.addToHistory(expression, result);
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
                const expression = `√${this.currentOperand}`;
                historyManager.addToHistory(expression, result);
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
                const expression = `${this.currentOperand}%`;
                historyManager.addToHistory(expression, result);
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
        
        // Сохраняем в историю
        const expression = `${this.previousOperand} ${this.operation} ${this.currentOperand}`;
        historyManager.addToHistory(expression, computation);
        
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

class HistoryManager {
    constructor() {
        this.history = JSON.parse(localStorage.getItem('calculatorHistory')) || [];
        this.historyContent = document.getElementById('history-content');
        this.isVisible = true;
        this.renderHistory();
    }

    addToHistory(expression, result) {
        const historyItem = {
            id: Date.now(),
            expression: expression,
            result: result,
            timestamp: new Date().toLocaleString('ru-RU')
        };
        
        this.history.unshift(historyItem);
        
        // Ограничиваем историю 50 записями
        if (this.history.length > 50) {
            this.history = this.history.slice(0, 50);
        }
        
        this.saveToStorage();
        this.renderHistory();
    }

    clearHistory() {
        if (confirm('Вы уверены, что хотите очистить историю?')) {
            this.history = [];
            this.saveToStorage();
            this.renderHistory();
        }
    }

    toggleHistory() {
        this.isVisible = !this.isVisible;
        const historyContent = document.querySelector('.history-content');
        
        if (this.isVisible) {
            historyContent.classList.remove('history-hidden');
        } else {
            historyContent.classList.add('history-hidden');
        }
    }

    useHistoryItem(historyItem) {
        // Восстанавливаем выражение в калькулятор
        const parts = historyItem.expression.split(' ');
        if (parts.length === 3) {
            calculator.clear();
            calculator.appendNumber(parts[0]);
            calculator.chooseOperation(parts[1]);
            calculator.appendNumber(parts[2]);
        }
    }

    renderHistory() {
        if (this.history.length === 0) {
            this.historyContent.innerHTML = '<div class="history-empty">История пуста</div>';
            return;
        }

        this.historyContent.innerHTML = this.history.map(item => `
            <div class="history-item" onclick="historyManager.useHistoryItem(${JSON.stringify(item).replace(/"/g, '&quot;')})">
                <div class="history-expression">${item.expression}</div>
                <div class="history-result">= ${this.formatNumber(item.result)}</div>
                <div class="history-time">${item.timestamp}</div>
            </div>
        `).join('');
    }

    formatNumber(number) {
        if (number % 1 === 0) {
            return number.toLocaleString('ru-RU');
        } else {
            return parseFloat(number.toFixed(10)).toLocaleString('ru-RU');
        }
    }

    saveToStorage() {
        localStorage.setItem('calculatorHistory', JSON.stringify(this.history));
    }
}

// Инициализация
const previousOperandElement = document.getElementById('previous-operand');
const currentOperandElement = document.getElementById('current-operand');

const calculator = new Calculator(previousOperandElement, currentOperandElement);
const historyManager = new HistoryManager();

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
