-- Drop existing tables if they exist (in reverse order due to dependencies)
DROP TABLE IF EXISTS public.OrderItems;
DROP TABLE IF EXISTS public.Orders;
DROP TABLE IF EXISTS public.MenuItems;
DROP TABLE IF EXISTS public."tables";

-- Create the Table table
CREATE TABLE public."tables" (
    table_no INT PRIMARY KEY
);

-- Create the MenuItems table
CREATE TABLE public.MenuItems (
    item_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    availability BOOLEAN NOT NULL DEFAULT TRUE
);

-- Create the Orders table
CREATE TABLE public.Orders (
    order_id SERIAL PRIMARY KEY,
    table_id INT NOT NULL,
    order_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    delivery_time TIMESTAMP,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    CONSTRAINT fk_table FOREIGN KEY (table_id) REFERENCES public."tables"(table_no)
);

-- Create the OrderItems table
CREATE TABLE public.OrderItems (
    order_item_id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL,
    item_id INTEGER NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    CONSTRAINT fk_order FOREIGN KEY (order_id) REFERENCES public.Orders(order_id),
    CONSTRAINT fk_item FOREIGN KEY (item_id) REFERENCES public.MenuItems(item_id)
);

-- Create indexes for better query performance
CREATE INDEX idx_orders_table_id ON public.Orders (table_id);
CREATE INDEX idx_orders_order_time ON public.Orders (order_time);
CREATE INDEX idx_orders_status ON public.Orders (status);
CREATE INDEX idx_orderitems_order_id ON public.OrderItems (order_id);
CREATE INDEX idx_orderitems_item_id ON public.OrderItems (item_id);