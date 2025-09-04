variable "table_name" { 
    type = string 
}
variable "tags" { 
    type = map(string) 
    default = {} 
    }
variable "enable_streams" { 
    type = bool 
    default = true
 }