import Box from '@/ui/v2/Box';
import Slider from '@/ui/v2/Slider';
import Text from '@/ui/v2/Text';
import { RESOURCE_CPU_STEP, RESOURCE_RAM_STEP } from '@/utils/CONSTANTS';
import type { ResourceSettingsFormValues } from '@/utils/settings/resourceSettingsValidationSchema';
import {
  MAX_SERVICE_CPU,
  MAX_SERVICE_RAM,
  MIN_SERVICE_CPU,
  MIN_SERVICE_RAM,
} from '@/utils/settings/resourceSettingsValidationSchema';
import { useFormContext, useWatch } from 'react-hook-form';

export interface ResourceFormFragmentProps {
  /**
   * The title of the form fragment.
   */
  title: string;
  /**
   * The description of the form fragment.
   */
  description: string;
  /**
   * Form field name for CPU.
   */
  cpuKey: Exclude<
    keyof ResourceSettingsFormValues,
    'enabled' | 'totalAvailableCPU' | 'totalAvailableRAM'
  >;
  /**
   * Form field name for RAM.
   */
  ramKey: Exclude<
    keyof ResourceSettingsFormValues,
    'enabled' | 'totalAvailableCPU' | 'totalAvailableRAM'
  >;
}

export default function ResourceFormFragment({
  title,
  description,
  cpuKey,
  ramKey,
}: ResourceFormFragmentProps) {
  const { setValue } = useFormContext<ResourceSettingsFormValues>();
  const values = useWatch<ResourceSettingsFormValues>();

  // Total allocated CPU for all resources
  const totalAllocatedCPU = Object.keys(values)
    .filter((key) => key.endsWith('CPU') && key !== 'totalAvailableCPU')
    .reduce((acc, key) => acc + values[key], 0);

  // Total allocated RAM for all resources
  const totalAllocatedRAM = Object.keys(values)
    .filter((key) => key.endsWith('RAM') && key !== 'totalAvailableRAM')
    .reduce((acc, key) => acc + values[key], 0);

  const remainingCPU = values.totalAvailableCPU - totalAllocatedCPU;
  const allowedCPU = remainingCPU + values[cpuKey];

  const remainingRAM = values.totalAvailableRAM - totalAllocatedRAM;
  const allowedRAM = remainingRAM + values[ramKey];

  function handleCPUChange(value: string) {
    const updatedCPU = parseFloat(value);
    const exceedsAvailableCPU =
      updatedCPU + (totalAllocatedCPU - values[cpuKey]) >
      values.totalAvailableCPU;

    if (
      Number.isNaN(updatedCPU) ||
      exceedsAvailableCPU ||
      updatedCPU < MIN_SERVICE_CPU
    ) {
      return;
    }

    setValue(cpuKey, updatedCPU, { shouldDirty: true });
  }

  function handleRAMChange(value: string) {
    const updatedRAM = parseFloat(value);
    const exceedsAvailableRAM =
      updatedRAM + (totalAllocatedRAM - values[ramKey]) >
      values.totalAvailableRAM;

    if (
      Number.isNaN(updatedRAM) ||
      exceedsAvailableRAM ||
      updatedRAM < MIN_SERVICE_RAM
    ) {
      return;
    }

    setValue(ramKey, updatedRAM, { shouldDirty: true });
  }

  return (
    <Box className="flex flex-col gap-4 p-4">
      <Box className="flex flex-col gap-2">
        <Text variant="h3" className="font-semibold">
          {title}
        </Text>

        <Text color="secondary">{description}</Text>
      </Box>

      <Box className="flex flex-col gap-2">
        <Text className="text-base">
          Allocated CPU: <span className="font-medium">{values[cpuKey]}</span>
        </Text>

        <Slider
          value={values[cpuKey]}
          onChange={(_event, value) => handleCPUChange(value.toString())}
          max={MAX_SERVICE_CPU}
          step={RESOURCE_CPU_STEP}
          allowed={allowedCPU}
          aria-label={`${title} CPU Slider`}
          marks
        />
      </Box>

      <Box className="flex flex-col gap-2">
        <Text className="text-base">
          Allocated Memory:{' '}
          <span className="font-medium">{values[cpuKey]} GiB</span>
        </Text>

        <Slider
          value={values[ramKey]}
          onChange={(_event, value) => handleRAMChange(value.toString())}
          max={MAX_SERVICE_RAM}
          step={RESOURCE_RAM_STEP}
          allowed={allowedRAM}
          aria-label={`${title} RAM Slider`}
          marks
        />
      </Box>
    </Box>
  );
}
