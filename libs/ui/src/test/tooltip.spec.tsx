import { fireEvent, render, screen } from '@testing-library/react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@app/ui/tooltip';

function renderTooltip() {
  render(
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button type="button">Archive</button>
        </TooltipTrigger>
        <TooltipContent>Hides the item from every list</TooltipContent>
      </Tooltip>
    </TooltipProvider>,
  );
  return screen.getByRole('button', { name: 'Archive' });
}

describe('Tooltip', () => {
  it('appears on keyboard focus and describes the trigger', () => {
    const trigger = renderTooltip();
    expect(screen.queryByRole('tooltip')).toBeNull();

    fireEvent.focus(trigger);

    const tooltip = screen.getByRole('tooltip');
    expect(tooltip.textContent).toBe('Hides the item from every list');
    expect(trigger.getAttribute('aria-describedby')).toBe(tooltip.id);
  });

  it('goes away when focus leaves', () => {
    const trigger = renderTooltip();
    fireEvent.focus(trigger);

    fireEvent.blur(trigger);

    expect(screen.queryByRole('tooltip')).toBeNull();
  });
});
