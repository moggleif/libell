package com.moggleif.levelmate

import org.junit.Assert.assertEquals
import org.junit.Test

/** Smoke test proving the JVM unit-test harness runs in CI. Real behavior tests
 * arrive test-first with their feature issues (see docs/02-REQUIREMENTS.md). */
class ExampleUnitTest {
    @Test
    fun harness_runs() {
        assertEquals(4, 2 + 2)
    }
}
