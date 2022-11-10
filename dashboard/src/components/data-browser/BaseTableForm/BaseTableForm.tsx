import { useDialog } from '@/components/common/DialogProvider';
import Form from '@/components/common/Form';
import { baseColumnValidationSchema } from '@/components/data-browser/BaseColumnForm';
import type { DatabaseTable, ForeignKeyRelation } from '@/types/data-browser';
import Button from '@/ui/v2/Button';
import Input from '@/ui/v2/Input';
import { useEffect } from 'react';
import { useFormContext, useFormState } from 'react-hook-form';
import * as Yup from 'yup';
import ColumnEditorTable from './ColumnEditorTable';
import ForeignKeyEditorSection from './ForeignKeyEditorSection';
import IdentityColumnSelect from './IdentityColumnSelect';
import PrimaryKeySelect from './PrimaryKeySelect';

export interface BaseTableFormValues
  extends Omit<DatabaseTable, 'primaryKey' | 'identityColumn'> {
  /**
   * The index of the primary key column.
   */
  primaryKeyIndex: number;
  /**
   * The index of the identity column.
   */
  identityColumnIndex?: number;
  /**
   * Foreign keys of the table.
   */
  foreignKeyRelations?: ForeignKeyRelation[];
}

export interface BaseTableFormProps {
  /**
   * Function to be called when the form is submitted.
   */
  onSubmit: (values: BaseTableFormValues) => Promise<void>;
  /**
   * Function to be called when the operation is cancelled.
   */
  onCancel?: VoidFunction;
  /**
   * Submit button text.
   *
   * @default 'Save'
   */
  submitButtonText?: string;
}

export const baseTableValidationSchema = Yup.object({
  name: Yup.string()
    .required('This field is required.')
    .matches(
      /^([A-Za-z]|_)+/i,
      'Table name must start with a letter or underscore.',
    )
    .matches(
      /^\w+$/i,
      'Table name must contain only letters, numbers, or underscores.',
    ),
  columns: Yup.array()
    .of(baseColumnValidationSchema)
    .test({
      message: 'At least one column is required.',
      test: (columns) => columns?.length > 0,
    })
    .test({
      message: 'The table must contain only unique column names.',
      test: (columns) =>
        new Set(columns?.map(({ name }) => name)).size === columns?.length,
    }),
  primaryKeyIndex: Yup.number().nullable().required('This field is required.'),
  identityColumnIndex: Yup.number().nullable(),
});

function NameInput() {
  const { register } = useFormContext();
  const { errors } = useFormState({ name: 'name' });

  return (
    <Input
      {...register('name')}
      id="name"
      fullWidth
      label="Name"
      helperText={
        typeof errors.name?.message === 'string' ? errors.name?.message : ''
      }
      hideEmptyHelperText
      error={Boolean(errors.name)}
      variant="inline"
      className="col-span-8 py-3"
      autoFocus
    />
  );
}

function FormFooter({
  onCancel,
  submitButtonText,
}: Pick<BaseTableFormProps, 'onCancel' | 'submitButtonText'>) {
  const { onDirtyStateChange } = useDialog();
  const { isSubmitting, dirtyFields } = useFormState();

  // react-hook-form's isDirty gets true even if an input field is focused, then
  // immediately unfocused - we can't rely on that information
  const isDirty = Object.keys(dirtyFields).length > 0;

  useEffect(() => {
    onDirtyStateChange(isDirty, 'drawer');
  }, [isDirty, onDirtyStateChange]);

  return (
    <div className="grid justify-between flex-shrink-0 grid-flow-col gap-3 p-2 border-gray-200 border-t-1">
      <Button
        variant="borderless"
        color="secondary"
        onClick={onCancel}
        tabIndex={isDirty ? -1 : 0}
      >
        Cancel
      </Button>

      <Button
        loading={isSubmitting}
        disabled={isSubmitting}
        type="submit"
        className="justify-self-end"
      >
        {submitButtonText}
      </Button>
    </div>
  );
}

export default function BaseTableForm({
  onSubmit: handleExternalSubmit,
  onCancel,
  submitButtonText = 'Save',
}: BaseTableFormProps) {
  return (
    <Form
      onSubmit={handleExternalSubmit}
      className="flex flex-col content-between flex-auto overflow-hidden border-gray-200 border-t-1"
    >
      <div className="flex-auto pb-4 overflow-y-auto">
        <section className="grid grid-cols-8 px-6 py-3">
          <NameInput />
        </section>

        <section className="grid grid-cols-8 px-6 py-3 border-gray-200 border-t-1">
          <h2 className="col-span-8 mt-3 mb-1.5 text-sm+ font-bold text-greyscaleDark">
            Columns
          </h2>

          <ColumnEditorTable />
          <PrimaryKeySelect />
          <IdentityColumnSelect />
        </section>

        <ForeignKeyEditorSection />
      </div>

      <FormFooter onCancel={onCancel} submitButtonText={submitButtonText} />
    </Form>
  );
}