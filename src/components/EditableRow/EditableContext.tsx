import React from "react";
import {FormInstance} from "antd/lib/form";

export const EditableContext = React.createContext<FormInstance | null>(null);