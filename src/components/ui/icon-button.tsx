import { Button, type ButtonProps } from "./button";

export type IconButtonProps = Omit<ButtonProps, "size" | "children"> & {
  children: ButtonProps["children"];
};

export function IconButton({ children, className, ...props }: IconButtonProps) {
  return (
    <Button
      {...props}
      size="md"
      className={className ? `aa-icon-button ${className}` : "aa-icon-button"}
    >
      {children}
    </Button>
  );
}
