import { fireEvent, render, screen } from '@testing-library/react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@app/ui/accordion';

function renderAccordion() {
  render(
    <Accordion type="single" collapsible>
      <AccordionItem value="general">
        <AccordionTrigger>General</AccordionTrigger>
        <AccordionContent>General body</AccordionContent>
      </AccordionItem>
      <AccordionItem value="advanced">
        <AccordionTrigger>Advanced</AccordionTrigger>
        <AccordionContent>Advanced body</AccordionContent>
      </AccordionItem>
    </Accordion>,
  );
}

describe('Accordion', () => {
  it('opens a labelled region from its trigger and closes it again', () => {
    renderAccordion();
    const general = screen.getByRole('button', { name: 'General' });
    expect(general.getAttribute('aria-expanded')).toBe('false');
    expect(screen.queryByText('General body')).toBeNull();

    fireEvent.click(general);
    expect(general.getAttribute('aria-expanded')).toBe('true');
    expect(screen.getByRole('region', { name: 'General' }).textContent).toBe(
      'General body',
    );

    fireEvent.click(general);
    expect(screen.queryByText('General body')).toBeNull();
  });

  it('keeps a single item open at a time', () => {
    renderAccordion();
    fireEvent.click(screen.getByRole('button', { name: 'General' }));

    fireEvent.click(screen.getByRole('button', { name: 'Advanced' }));

    expect(screen.queryByText('General body')).toBeNull();
    expect(screen.getByText('Advanced body')).toBeTruthy();
  });
});
