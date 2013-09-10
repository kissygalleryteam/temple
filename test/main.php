<?php 
class Engine{
  public $__s__ = "";
  public function render($env){
    $this->__s__ .= "\n";
    $this->__s__ .= "hi ";
    $this->__s__ .= $env["name"];
    return $this->__s__;
  }
}
$engine = new Engine;
print(
  $engine->render(Array())
)
?>

