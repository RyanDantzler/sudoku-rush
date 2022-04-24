$(() => {
    let popupWidth = $('#number-select-popup').outerWidth();
    let maxLeft = $(window).width() - popupWidth - 8;
    const textArea = document.getElementById("text-input");
    const coordInput = document.getElementById("coord");
    const valInput = document.getElementById("val");
    const output = document.getElementById("output");
    const timeDuration = document.getElementById("time-duration");
    const ratingNew = document.getElementById("rating-new");
    const ratingBonus = document.getElementById("rating-bonus");
    const difficulty = document.getElementById("difficulty");
    const sudokuContainer = document.getElementById('sudoku-container');
    const BASE_URL = 'https://sudoku-solver.ryandantzler.repl.co';

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

    const animateRating = (rating, ratingBonus) => {
        for (let i = 1; i <= ratingBonus; i++) {
            setTimeout(() => { ratingNew.innerHTML = rating + i }, 100 * i);
        }
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
        const data = await fetch(BASE_URL + "/api/demo", {
            method: "GET",
            credentials: 'include',
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
        difficulty.innerHTML = parsed.difficulty.charAt(0).toUpperCase() + parsed.difficulty.slice(1);
        fillpuzzle(parsed.puzzle, true);
    }

    const getPuzzle = async () => {
        const params = new Proxy(new URLSearchParams(window.location.search), {
            get: (searchParams, prop) => searchParams.get(prop),
        });
        const data = await fetch(BASE_URL + "/api/puzzle/" + params.id, {
            method: "GET",
            credentials: 'include',
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
        difficulty.innerHTML = parsed.difficulty.charAt(0).toUpperCase() + parsed.difficulty.slice(1);
        fillpuzzle(parsed.puzzle, true);
    }

    const getSolved = async () => {
        const inputs = { "puzzle": textArea.value }
        if (inputs.puzzle.indexOf('.') >= 0) {
            output.classList = 'error';
            output.innerHTML = `You cheated!`;
            return;
        }

        const data = await fetch(BASE_URL + "/api/solve", {
            method: "POST",
            headers: {
                "Accept": "application/json",
                "Content-type": "application/json"
            },
            body: JSON.stringify(inputs)
        })
        const parsed = await data.json();
        if (parsed.error) {
            errorMsg.innerHTML = `<code>${JSON.stringify(parsed, null, 2)}</code>`;
            return;
        }
        fillpuzzle(parsed.solution, false);
    }

    const getChecked = async () => {
        const inputs = { "puzzle": textArea.value, "coordinate": coordInput.value, "value": valInput.value }
        const data = await fetch(BASE_URL + "/api/check", {
            method: "POST",
            headers: {
                "Accept": "application/json",
                "Content-type": "application/json"
            },
            body: JSON.stringify(inputs)
        })
        const parsed = await data.json();
        output.innerHTML = `<code>${JSON.stringify(parsed, null, 2)}</code>`;
    }

    const validatePuzzle = async () => {
        const inputs = { "puzzle": textArea.value }
        if (textArea.value.indexOf('.') >= 0)
            return;

        const data = await fetch(BASE_URL + "/api/solve", {
            method: "POST",
            credentials: 'include',
            headers: {
                "Accept": "application/json",
                "Content-type": "application/json"
            },
            body: JSON.stringify(inputs)
        })
        const parsed = await data.json();
        if (parsed.error) {
            output.classList = 'error';
            output.innerHTML = `INCORRECT!`;
            animateCSS('#validate-button', 'shakeX');
            return false;
        }

        sudokuContainer.classList = 'validated';
        timeDuration.innerHTML = parsed.time;
        ratingNew.innerHTML = parsed.rating;
        setTimeout(() => { animateRating(parseInt(parsed.rating, 10), parseInt(parsed.ratingBonus, 10)) }, 1500);
        ratingBonus.innerHTML = '+' + parsed.ratingBonus.toString();
        output.classList = 'correct';
        output.innerHTML = `CORRECT!`;
        animateCSS('#game-summary-container', 'fadeInDown');
        animateCSS('#validate-button', 'shakeY');
        return true;
    }

    $(window).on('resize', function(e) {
        popupWidth = $('#number-select-popup').outerWidth();
        maxLeft = $(window).width() - popupWidth - 8;
        let $selected = $('.highlight');
        if ($selected.length == 1) {
            let offset = $selected.offset();
            let left = offset.left;
            let index = $selected.index();
            left = left - (popupWidth / 2) + ($selected.outerWidth() / 2);
            left = index == 1 ? left - 1 : index == 7 ? left + 1 : left;

            $('#number-select-popup').css({
                left: left > 7 ? left < maxLeft ? left : maxLeft : 8,
                top: offset.top + $selected.height() + 2
            });
        }
    });

    $('body').on('click', function (e) {
        let target = $(e.target);
        if ((target.hasClass('sudoku-input') && !target.hasClass('locked')) || e.target.id === "number-select-popup")
            return;

        $('.highlight').removeClass('highlight');
        $('#number-select-popup').css({ visibility: 'hidden' }).attr('data-cell', "");
    });

    $('.sudoku-input:not(.locked)').on('click', function (e) {
        if ($('#sudoku-container').hasClass('validated'))
            return;

        let $this = $(this);

        $('.highlight').not($this).removeClass('highlight');
        $this.toggleClass('highlight');

        if ($this.hasClass('highlight')) {
            let offset = $this.offset();
            let left = offset.left;
            let cell = $this.attr('id');
            let index = $this.index();
            left = left - (popupWidth / 2) + ($this.outerWidth() / 2);
            left = index == 1 ? left - 1 : index == 7 ? left + 1 : left;

            $('#number-select-popup').css({
                visibility: 'visible',
                left: left > 7 ? left < maxLeft ? left : maxLeft : 8,
                top: offset.top + $this.height() + 2
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

    $("#validate-button").on('click', function() {
        if (sudokuContainer.classList == 'validated') {
            animateCSS('#game-summary-container', 'fadeInDown');
            return;
        }

        validatePuzzle();
    });

    $('#game-summary .close').on('click', function(e) {
        animateCSS('#game-summary-container', 'fadeOutDown');
    });

    $('#new-puzzle-button').on('click', function(e) {
        $('.locked').removeClass('locked');
        $('#output').text('');
        $('#validate-button').prop('disabled', true);
        $('#sudoku-container').removeClass('validated');
        getDemo();
        animateCSS('#game-summary-container', 'fadeOutDown');
    });

    getDemo();
    // getPuzzle();
});