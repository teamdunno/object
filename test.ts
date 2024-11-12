import { assertEquals } from "jsr:@std/assert";
import * as obj from "jsr:@cupglassdev/object";
Deno.test({
    name:"Custom extended array",
    fn:function(_){
      const v = new Int8Array()
      assertEquals(obj.isExtendedArray(v), true)
      assertEquals(obj.isLiteralArray(v), false)
    }
})
Deno.test({
    name:"Literal array",
    fn:function(_){
      const v = ['test']
      assertEquals(obj.isLiteralArray(v), true)
      assertEquals(obj.isExtendedArray(v), false)
    }
})
Deno.test({
    name:"Same reference is true?",
    fn:function(_){
      const v = ['test']
      const v2 = v
      assertEquals(obj.refCompare(v, v2), true)
    }
})
Deno.test({
    name:"Diffrent reference is false?",
    fn:function(_){
      const v = ['test']
      const v2 = ['test']
      assertEquals(obj.refCompare(v, v2), false)
    }
})