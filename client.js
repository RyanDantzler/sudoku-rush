const textArea = document.getElementById("text-input");
const coordInput = document.getElementById("coord");
const valInput = document.getElementById("val");
const output = document.getElementById("output");

document.addEventListener("DOMContentLoaded", () => {
    getDemo();
    // getPuzzle();
    // textArea.value =
    //     "..9..5.1.85.4....2432......1...69.83.9.....6.62.71...9......1945....4.37.4.3..6..";
    // fillpuzzle(textArea.value, true);
});

// textArea.addEventListener("input", () => {
//     fillpuzzle(textArea.value, false);
// });

const animateCSS = (element, animation, prefix = 'animate__') => {
    // We create a Promise and return it
    new Promise((resolve, reject) => {
        const animationName = `${prefix}${animation}`;
        const node = document.querySelector(element);

        if (animation.indexOf('In') >= 0)
            node.classList.add('show');

        node.classList.add(`${prefix}animated`, animationName);

        // When the animation ends, we clean the classes and resolve the Promise
        function handleAnimationEnd(event) {
            event.stopPropagation();

            if (animation.indexOf('Out') >= 0)
                node.classList.remove('show');

            node.classList.remove(`${prefix}animated`, animationName);
            resolve('Animation ended');
        }

        node.addEventListener('animationend', handleAnimationEnd, { once: true });
    });
}

const fillpuzzle = (data, initial) => {
    let len = data.length < 81 ? data.length : 81;
    for (let i = 0; i < len; i++) {
        let rowLetter = String.fromCharCode('A'.charCodeAt(0) + Math.floor(i / 9));
        let col = (i % 9) + 1;
        if (!data[i] || data[i] === ".") {
            document.getElementsByClassName(rowLetter + col)[0].innerText = " ";
            continue;
        }
        document.getElementsByClassName(rowLetter + col)[0].innerText = data[i];
        if (initial)
            document.getElementsByClassName(rowLetter + col)[0].classList.add("locked");
    }
    return;
}

const getDemo = async () => {
    const params = new Proxy(new URLSearchParams(window.location.search), {
        get: (searchParams, prop) => searchParams.get(prop),
      });
    const data = await fetch("https://sudoku-solver.ryandantzler.repl.co/api/demo", { // /" + params.id, {
        method: "GET",
        headers: {
            "Accept": "application/json"
        }
    })
    const parsed = await data.json();
    if (parsed.error) {
        errorMsg.innerHTML = `<code>${JSON.stringify(parsed, null, 2)}</code>`;
        return;
    }
    textArea.value = parsed.puzzle;
    fillpuzzle(parsed.puzzle, true);
}

const getPuzzle = async () => {
    const params = new Proxy(new URLSearchParams(window.location.search), {
        get: (searchParams, prop) => searchParams.get(prop),
      });
    const data = await fetch("https://sudoku-solver.ryandantzler.repl.co/api/puzzle/" + params.id, {
        method: "GET",
        headers: {
            "Accept": "application/json"
        }
    });

    const parsed = await data.json();
    if (parsed.error) {
        errorMsg.innerHTML = `<code>${JSON.stringify(parsed, null, 2)}</code>`;
        return;
    }
    textArea.value = parsed.puzzle;
    fillpuzzle(parsed.puzzle, true);
}

const getSolved = async () => {
    const stuff = { "puzzle": textArea.value }
    if (stuff.puzzle.indexOf('.') >= 0) {
        output.classList = 'error';
        output.innerHTML = `You cheated!`;
        return;
    }

    const data = await fetch("https://sudoku-solver.ryandantzler.repl.co/api/solve", {
        method: "POST",
        headers: {
            "Accept": "application/json",
            "Content-type": "application/json"
        },
        body: JSON.stringify(stuff)
    })
    const parsed = await data.json();
    if (parsed.error) {
        errorMsg.innerHTML = `<code>${JSON.stringify(parsed, null, 2)}</code>`;
        return;
    }
    fillpuzzle(parsed.solution, false);
}

const getChecked = async () => {
    const stuff = { "puzzle": textArea.value, "coordinate": coordInput.value, "value": valInput.value }
    const data = await fetch("https://sudoku-solver.ryandantzler.repl.co/api/check", {
        method: "POST",
        headers: {
            "Accept": "application/json",
            "Content-type": "application/json"
        },
        body: JSON.stringify(stuff)
    })
    const parsed = await data.json();
    output.innerHTML = `<code>${JSON.stringify(parsed, null, 2)}</code>`;
}

const validatePuzzle = async () => {
    const stuff = { "puzzle": textArea.value }
    if (stuff.puzzle.indexOf('.') >= 0)
        return;

    const data = await fetch("https://sudoku-solver.ryandantzler.repl.co/api/solve", {
        method: "POST",
        headers: {
            "Accept": "application/json",
            "Content-type": "application/json"
        },
        body: JSON.stringify(stuff)
    })
    const parsed = await data.json();
    if (parsed.error) {
        output.classList = 'error';
        output.innerHTML = `INCORRECT!`;
        animateCSS('#validate-button', 'shakeX');
        return false;
    }

    output.classList = 'correct';
    output.innerHTML = `CORRECT!`;
    animateCSS('#game-summary-container', 'fadeInDown');
    animateCSS('#validate-button', 'shakeY');
    return true;
}

document.getElementById("solve-button").addEventListener("click", getSolved)
document.getElementById("check-button").addEventListener("click", getChecked)
document.getElementById("validate-button").addEventListener("click", validatePuzzle)

$(() => {
    const popupWidth = $('#number-select-popup').outerWidth();
    const maxLeft = $(window).width() - popupWidth - 8;

    // TODO: Window Resize event

    $('body').on('click', function (el) {
        let target = $(el.target);
        if ((target.hasClass('sudoku-input') && !target.hasClass('locked')) || el.target.id === "number-select-popup")
            return;

        $('.highlight').removeClass('highlight');
        $('#number-select-popup').css({ visibility: 'hidden' }).attr('data-cell', "");
    });

    $('.sudoku-input:not(.locked)').on('click', function (e) {
        let $this = $(this);
        let { left, top } = $this.offset();
        let cell = $this.attr('id');

        $('.highlight').not($this).removeClass('highlight');
        $this.toggleClass('highlight');

        if ($this.hasClass('highlight')) {
            let index = $this.index();
            left = left - (popupWidth / 2) + ($this.outerWidth() / 2);
            left = index == 1 ? left - 1 : index == 7 ? left + 1 : left;

            $('#number-select-popup').css({
                visibility: 'visible',
                left: left > 7 ? left < maxLeft ? left : maxLeft : 8,
                top: top + $(this).height() + 2
            }).attr('data-cell', cell);
        } else {
            $('#number-select-popup').css({ visibility: 'hidden' });
        }
        $('#output').text('');
    });

    $('#number-select-popup button').on('click', function (e) {
        const value = $(this).attr('value');
        let cell = $('#number-select-popup').attr('data-cell');

        $('.' + cell).text(value);

        let arr = textArea.value.split('');
        const row = cell.charCodeAt(0) - 'A'.charCodeAt(0);
        const index = (row * 9) + parseInt(cell[1]) - 1;
        arr[index] = value == "" ? '.' : value;

        textArea.value = arr.join('');

        if (arr.indexOf('.') < 0)
            $('#validate-button').prop('disabled', false);
        else
            $('#validate-button').prop('disabled', true);
    });

    $('#game-summary .close').on('click', function(e) {
        animateCSS('#game-summary-container', 'fadeOutDown');
    });

    $('#new-puzzle-button').on('click', function(e) {
        $('.locked').removeClass('locked');
        $('#output').text('');
        $('#validate-button').prop('disabled', true);
        getDemo();
        animateCSS('#game-summary-container', 'fadeOutDown');
    });
});