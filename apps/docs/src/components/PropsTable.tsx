import type { PropDoc } from '../props/types';
import { InlineText } from './InlineText';

interface PropsTableProps {
  /** The exported props type, e.g. `DatePickerProps`. */
  typeName: string;
  props: PropDoc[];
}

export function PropsTable({ typeName, props }: PropsTableProps) {
  return (
    <div className="table-scroll" role="region" aria-label={`${typeName} reference`} tabIndex={0}>
      <table className="props-table">
        <caption>
          <code>{typeName}</code>
        </caption>
        <thead>
          <tr>
            <th scope="col">Prop</th>
            <th scope="col">Type</th>
            <th scope="col">Default</th>
            <th scope="col">Description</th>
          </tr>
        </thead>
        <tbody>
          {props.map((prop) => (
            <tr key={prop.name}>
              <th scope="row">
                <code>{prop.name}</code>
              </th>
              <td>
                <code className="prop-type">{prop.type}</code>
              </td>
              <td>{prop.default ? <InlineText text={prop.default} /> : '—'}</td>
              <td>
                <InlineText text={prop.description} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
