import React from 'react';
import {useDispatch} from 'react-redux';
import {InputNumber} from 'primereact/inputnumber';
import type {InputNumberValueChangeEvent, InputNumberChangeEvent} from 'primereact/inputnumber';
import {Slider} from 'primereact/slider';
import {SelectButton} from 'primereact/selectbutton';
import {Dropdown} from 'primereact/dropdown';
import CollapsibleCard from './CollapsibleCard';
import type {AppDispatch} from '../store';
import {
    setEffortModel,
    setUphillCost,
    setDownhillBenefit,
    setPowerExponent,
    setSplitStrategy,
    setSplitStrength
} from '../store/settingsSlice';
import {setIsCalculating} from '../store/resultsSlice';
import type {EffortModel} from '../store/settingsSlice';
import HelpIcon from './HelpIcon';
import {useT} from '../i18n/useT';
import {useAppSettings} from '../hooks/useAppSettings';

const EffortSettings: React.FC = () => {
    const dispatch = useDispatch<AppDispatch>();
    const t = useT();
    const {effortModel, uphillCost, downhillBenefit, powerExponent, splitStrategy, splitStrength} = useAppSettings();
    const modelOptions: { label: string; value: EffortModel }[] = [
        {label: t.effortModelMinetti, value: 'minetti'},
        {label: t.effortModelLinear, value: 'linear'},
        {label: t.effortModelPower, value: 'power'},
        {label: t.effortModelExponential, value: 'exponential'},
    ];

    const splitOptions = [
        {label: t.splitNegative, value: 'negative'},
        {label: t.splitEven, value: 'even'},
        {label: t.splitPositive, value: 'positive'},
    ];

    const handleEffortModel = (e: { value: EffortModel }) => {
        dispatch(setIsCalculating(true));
        dispatch(setEffortModel(e.value));
    };
    const handlePowerExponent = (e: InputNumberChangeEvent) => {
        dispatch(setIsCalculating(true));
        dispatch(setPowerExponent(e.value ?? 1.5));
    };
    const handleUphillCost = (e: InputNumberValueChangeEvent) => {
        dispatch(setIsCalculating(true));
        dispatch(setUphillCost(e.value ?? 15));
    };
    const handleDownhillBenefit = (e: InputNumberValueChangeEvent) => {
        dispatch(setIsCalculating(true));
        dispatch(setDownhillBenefit(e.value ?? 8));
    };
    const handleSplitStrategy = (e: { value: string }) => {
        dispatch(setIsCalculating(true));
        dispatch(setSplitStrategy(e.value as 'negative' | 'even' | 'positive'));
    };
    const handleSplitStrength = (e: { value: number | number[] }) => {
        dispatch(setIsCalculating(true));
        dispatch(setSplitStrength((e.value as number) / 100));
    };

    return (
        <CollapsibleCard title={t.effortCard} className="mb-3">
            <div className="effort-section">
                <label className="block mb-1 text-sm font-medium">
                    {t.effortModelLabel}
                    <HelpIcon id="help-effort-model" text={t.helpEffortModel}/>
                </label>
                <Dropdown
                    value={effortModel}
                    options={modelOptions}
                    onChange={handleEffortModel}
                />
            </div>

            {effortModel === 'power' && (
                <div className="effort-section">
                    <label className="block mb-1 text-sm font-medium">
                        {t.powerExponentLabel}
                        <HelpIcon id="help-power-exp" text={t.helpPowerExponent}/>
                    </label>
                    <InputNumber
                        value={powerExponent}
                        onChange={handlePowerExponent}
                        min={1} max={3} step={0.1}
                        minFractionDigits={1} maxFractionDigits={1}
                        showButtons
                    />
                </div>
            )}

            {effortModel !== 'minetti' && (
                <div className="effort-cost-row">
                    <div className="effort-cost-item">
                        <label className="block mb-1 text-sm font-medium effort-cost-item__label">
                            {t.uphillLabel}
                            <HelpIcon id="help-uphill" text={t.helpUphill}/>
                        </label>
                        <InputNumber value={uphillCost} onValueChange={handleUphillCost} min={0} max={60} step={1}
                                     showButtons suffix=" s"/>
                    </div>
                    <div className="effort-cost-item">
                        <label className="block mb-1 text-sm font-medium effort-cost-item__label">
                            {t.downhillLabel}
                            <HelpIcon id="help-downhill" text={t.helpDownhill}/>
                        </label>
                        <InputNumber value={downhillBenefit} onValueChange={handleDownhillBenefit} min={0} max={40}
                                     step={1} showButtons suffix=" s"/>
                    </div>
                </div>
            )}

            <div className="effort-section">
                <label className="block mb-2 text-sm font-medium">{t.splitLabel}</label>
                <SelectButton value={splitStrategy} options={splitOptions} onChange={handleSplitStrategy}/>
            </div>

            {splitStrategy !== 'even' && (
                <div className="pb-3">
                    <label className="block mb-2 text-sm font-medium">
                        {t.splitStrengthLabel}: <strong>{Math.round(splitStrength * 100)}%</strong>
                    </label>
                    <Slider value={Math.round(splitStrength * 100)} onChange={handleSplitStrength} min={0} max={20}
                            step={1}/>
                </div>
            )}
        </CollapsibleCard>
    );
};

export default EffortSettings;
