'use strict';

(function() {
    if (typeof window === 'undefined' || typeof React === 'undefined') return;
    const { useState, useEffect } = React;

    const EvaluationFields = ({ scores, checkboxes, onScoreChange, onCheckboxChange, onCommentChange, participantId = '', compact = false }) => (
        React.createElement('div', { className: `evaluation-form ${compact ? 'compact' : ''}` },
            React.createElement('div', { className: 'select-group' },
                ...PARTICIPANT_PARAMETERS.map(param =>
                    React.createElement('div', { key: param.column, className: 'select-row' },
                        React.createElement('div', null, param.label),
                        React.createElement('select', {
                            className: 'data-input input-field',
                            value: scores[param.column] || '',
                            onChange: (e) => onScoreChange(param.column, e.target.value)
                        },
                            React.createElement('option', { value: '' }, '-'),
                            ...Array.from({ length: param.options }, (_, i) => React.createElement('option', { key: i + 1, value: i + 1 }, i + 1))
                        )
                    )
                )
            ),
            React.createElement('div', { className: 'textarea-group' },
                React.createElement('div', { className: 'textarea-row' },
                    React.createElement('div', null, 'Комментарий'),
                    React.createElement('textarea', {
                        className: 'data-input input-field',
                        value: scores.comment || '',
                        onChange: (e) => onCommentChange(e.target.value),
                        rows: 3,
                        placeholder: 'комментарий'
                    })
                )
            ),
            React.createElement('div', { className: 'checkbox-group' },
                ...getActiveSpecialPrizes().map((prize, index) =>
                    React.createElement('div', { key: prize.column, className: 'checkbox-row' },
                        React.createElement('label', { htmlFor: `checkbox-${participantId}-${prize.column}` }, prize.label),
                        React.createElement('input', {
                            type: 'checkbox',
                            id: `checkbox-${participantId}-${prize.column}`,
                            checked: checkboxes[index] || false,
                            onChange: (e) => onCheckboxChange(index, e.target.checked)
                        })
                    )
                )
            )
        )
    );

    const EvaluationForm = ({ participant, onScoreChange, onCommentChange, debounce }) => {
        const [scores, setScores] = useState({ C: '', D: '', E: '', F: '', comment: '' });
        const [checkboxes, setCheckboxes] = useState({});

        useEffect(() => {
            const loadCurrentValues = () => {
                try {
                    const cachedData = googleSheetsApi.getCachedData(SHEET_CONFIG.mainSheet, RangeHelper.getParticipantsRange());
                    if (cachedData && cachedData.values) {
                        const rowIndex = participant.row - 1;
                        if (rowIndex >= 0 && rowIndex < cachedData.values.length) {
                            const row = cachedData.values[rowIndex];
                            setScores({ C: row[2] || '', D: row[3] || '', E: row[4] || '', F: row[5] || '', comment: row[6] || '' });
                            const checkboxValues = {};
                            const activePrizes = getActiveSpecialPrizes();
                            activePrizes.forEach((prize, index) => {
                                const colIndex = prize.column.charCodeAt(0) - 'A'.charCodeAt(0);
                                checkboxValues[index] = row[colIndex] ? row[colIndex].toString().trim() !== '' : false;
                            });
                            setCheckboxes(checkboxValues);
                        }
                    }
                } catch (error) {
                    console.warn('Ошибка загрузки значений из кеша:', error);
                }
            };
            loadCurrentValues();
        }, [participant.row]);

        const saveImmediately = async (value, column, row, sheetName) => {
            try {
                await lazySaveManager.saveData(value, column, row, sheetName);
                console.log(`💾 Данные подготовлены к сохранению: ${sheetName} ${column}${row} = ${value}`);
            } catch (error) {
                console.error('Ошибка подготовки к сохранению:', error);
                telegramApi.showAlert('Ошибка сохранения данных');
            }
        };

        const handleScoreChange = (column, value) => {
            setScores(prev => ({ ...prev, [column]: value }));
            telegramApi.hapticFeedback('selection');
            if (debounce) {
                debounce(`score_${participant.id}_${column}`, async (val, col) => {
                    await saveImmediately(val, col, participant.row, SHEET_CONFIG.mainSheet);
                    onScoreChange?.(participant.id, col, val);
                }, 500, value, column);
            } else {
                saveImmediately(value, column, participant.row, SHEET_CONFIG.mainSheet);
                onScoreChange?.(participant.id, column, value);
            }
        };

        const handleCommentChange = (value) => {
            setScores(prev => ({ ...prev, comment: value }));
            if (debounce) {
                debounce(`comment_${participant.id}`, async (val) => {
                    await saveImmediately(val, 'G', participant.row, SHEET_CONFIG.mainSheet);
                    onCommentChange?.(participant.id, val);
                }, 1000, value);
            } else {
                saveImmediately(value, 'G', participant.row, SHEET_CONFIG.mainSheet);
                onCommentChange?.(participant.id, value);
            }
        };

        const handleCheckboxChange = (index, checked) => {
            setCheckboxes(prev => ({ ...prev, [index]: checked }));
            telegramApi.hapticFeedback('selection');
            const activePrizes = getActiveSpecialPrizes();
            const prize = activePrizes[index];
            if (prize) {
                const value = checked ? prize.value : '';
                if (debounce) {
                    debounce(`checkbox_${participant.id}_${index}`, async (val) => {
                        await saveImmediately(val, prize.column, participant.row, SHEET_CONFIG.mainSheet);
                    }, 300, value);
                } else {
                    saveImmediately(value, prize.column, participant.row, SHEET_CONFIG.mainSheet);
                }
            }
        };

        return React.createElement(EvaluationFields, { scores, checkboxes, onScoreChange: handleScoreChange, onCheckboxChange: handleCheckboxChange, onCommentChange: handleCommentChange, participantId: participant.id });
    };

    window.AppEvaluation = { EvaluationFields, EvaluationForm };
})();


